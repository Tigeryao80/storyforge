#!/usr/bin/env python3
"""
md-to-storyforge.py — Convert Markdown chapter drafts to StoryForge JSON format.

Usage:
    python md-to-storyforge.py [options] <output.storyforge> <input1.md> [input2.md ...]

Options:
    --title "Book Title"        Override book title (default: from first file's frontmatter)
    --author "Author Name"      Override author (default: from first file's frontmatter)
    --subtitle "Subtitle"       Override subtitle (default: from frontmatter)
    --goal 85000                Override word-count goal (default: from frontmatter)
    --brief project-brief.md    Read book-level metadata from a project brief file

Input Markdown format (chapter files):
    ---
    chapter: 1
    title: "Chapter Title"
    pov: Vivian
    word_count: 3200
    status: draft
    ---

    # Chapter 1: Chapter Title

    Paragraphs of prose...

    ## Scene 2: Optional Scene Heading

    More prose...

Input Markdown format (project brief):
    ---
    title: "Book Title"
    author: "Author Name"
    subtitle: "..."
    target_words: 85000
    ---

Scene splitting:
    - If ## Scene N: headings exist, they become scene boundaries.
    - Otherwise, prose is auto-split into ~500-word chunks.

StoryForge JSON format matches the mcp_storyforge schema.
"""

import json
import re
import sys
import os
from datetime import datetime, timezone


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from a Markdown file."""
    raw = raw.strip()
    if not raw.startswith("---"):
        return {}, raw
    end = raw.find("\n---", 3)
    if end == -1:
        return {}, raw
    fm_block = raw[3 + 1 : end]
    body = raw[end + 4 :].strip()
    fm = {}
    for line in fm_block.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, _, val = line.partition(":")
            val = val.strip().strip('"').strip("'")
            fm[key.strip()] = val
    return fm, body


def strip_h1_heading(body: str) -> str:
    """
    Remove a leading '# Chapter N: ...' or '# Title' heading from the body.
    The chapter title comes from frontmatter, so the H1 is redundant in StoryForge.
    """
    lines = body.splitlines()
    if lines and re.match(r"^#\s+", lines[0]):
        # Skip the first line and any following blank lines
        rest = lines[1:]
        # Strip leading blank lines
        while rest and not rest[0].strip():
            rest = rest[1:]
        return "\n".join(rest)
    return body


def html_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def split_scenes(body: str) -> list[dict]:
    """
    Split chapter body into scenes.

    Strategy:
    1. If ## Scene N: headings exist, use them as boundaries.
    2. Otherwise, treat each top-level ## Heading as a scene.
    3. If no headings at all, auto-split by ~500-word chunks.
    """
    scene_pattern = re.compile(r"^##\s+Scene\s+\d+[:\\s]", re.MULTILINE)
    general_h2_pattern = re.compile(r"^##\s+", re.MULTILINE)

    headings = list(scene_pattern.finditer(body))
    if not headings:
        headings = list(general_h2_pattern.finditer(body))

    scenes = []

    if headings:
        for i, m in enumerate(headings):
            start = m.end()
            end = headings[i + 1].start() if i + 1 < len(headings) else len(body)
            block = body[start:end].strip()
            heading_text = body[m.start() : m.end()].lstrip("#").strip()
            wc = len(block.split())
            paragraphs = [p.strip() for p in block.split("\n\n") if p.strip()]
            html_parts = [f"<p>{html_escape(p)}</p>" for p in paragraphs]
            content = f"<h2>{html_escape(heading_text)}</h2>" + "".join(html_parts)
            scenes.append(
                {
                    "id": f"sc-{i + 1:02d}",
                    "title": heading_text,
                    "order": i,
                    "content": content,
                    "wordCount": wc,
                }
            )
    else:
        # Auto-split by ~500 words per scene
        paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
        current_paragraphs: list[str] = []
        current_count = 0
        scene_num = 0

        for para in paragraphs:
            para_words = len(para.split())
            current_paragraphs.append(para)
            current_count += para_words
            if current_count >= 500:
                scene_num += 1
                content = "".join(
                    f"<p>{html_escape(p)}</p>" for p in current_paragraphs
                )
                scenes.append(
                    {
                        "id": f"sc-{scene_num:02d}",
                        "title": f"Scene {scene_num}",
                        "order": scene_num - 1,
                        "content": content,
                        "wordCount": current_count,
                    }
                )
                current_paragraphs = []
                current_count = 0

        if current_paragraphs:
            scene_num += 1
            content = "".join(
                f"<p>{html_escape(p)}</p>" for p in current_paragraphs
            )
            scenes.append(
                {
                    "id": f"sc-{scene_num:02d}",
                    "title": f"Scene {scene_num}",
                    "order": scene_num - 1,
                    "content": content,
                    "wordCount": current_count,
                }
            )

    # Ensure at least one scene
    if not scenes:
        wc = len(body.split())
        paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
        scenes.append(
            {
                "id": "sc-01",
                "title": "Scene 1",
                "order": 0,
                "content": "".join(f"<p>{html_escape(p)}</p>" for p in paragraphs),
                "wordCount": wc,
            }
        )

    return scenes


def word_count_from_scenes(scenes: list[dict]) -> int:
    return sum(s["wordCount"] for s in scenes)


def build_chapter(chapter_num: int, fm: dict, body: str) -> dict:
    """Build a single chapter dict from frontmatter and body."""
    title = fm.get("title", f"Chapter {chapter_num}")
    full_title = f"Chapter {chapter_num}: {title}"
    body_clean = strip_h1_heading(body)
    scenes = split_scenes(body_clean)
    wc = word_count_from_scenes(scenes)
    return {
        "id": f"ch-{chapter_num:02d}",
        "title": full_title,
        "order": chapter_num - 1,
        "collapsed": False,
        "wordCountGoal": max(wc, 3000),
        "scenes": scenes,
    }


def build_storyforge(
    chapters: list[dict],
    title: str,
    author: str,
    subtitle: str = "",
    word_count_goal: int = 80000,
    trim_size: str = "6x9",
) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return {
        "id": re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "book",
        "title": title,
        "author": author,
        "subtitle": subtitle,
        "parts": [],
        "chapters": chapters,
        "createdAt": now,
        "updatedAt": now,
        "wordCountGoal": word_count_goal,
        "trimSize": trim_size,
        "includeToc": True,
        "includeCopyright": True,
        "includeDedication": True,
        "copyrightText": f"© {datetime.now().year} {author}. All rights reserved.",
        "dedicationText": "",
    }


def parse_args(argv: list[str]) -> tuple[dict, str, list[str]]:
    """
    Parse CLI args. Returns (options_dict, output_path, input_paths).
    Supported flags: --title, --author, --subtitle, --goal, --brief
    First positional arg is output path, rest are input files.
    """
    opts: dict = {}
    positional: list[str] = []
    i = 1  # skip script name
    while i < len(argv):
        arg = argv[i]
        if arg in ("--title", "--author", "--subtitle", "--brief"):
            if i + 1 >= len(argv):
                print(f"Error: {arg} requires a value.")
                sys.exit(1)
            opts[arg[2:]] = argv[i + 1]
            i += 2
        elif arg == "--goal":
            if i + 1 >= len(argv):
                print("Error: --goal requires a value.")
                sys.exit(1)
            opts["goal"] = int(argv[i + 1])
            i += 2
        elif arg == "--help" or arg == "-h":
            print(__doc__)
            sys.exit(0)
        elif arg.startswith("-"):
            print(f"Unknown flag: {arg}")
            sys.exit(1)
        else:
            positional.append(arg)
            i += 1

    if len(positional) < 2:
        print(__doc__)
        print("Error: need at least an output file and one input file.")
        sys.exit(1)

    return opts, positional[0], positional[1:]


def main():
    opts, output_path, input_paths = parse_args(sys.argv)

    # Load book-level metadata from --brief if provided
    book_meta: dict = {}
    if "brief" in opts:
        brief_path = opts["brief"]
        if os.path.isfile(brief_path):
            with open(brief_path, "r", encoding="utf-8") as f:
                fm, _ = parse_frontmatter(f.read())
            book_meta = fm
        else:
            print(f"Warning: brief file '{brief_path}' not found.")

    # CLI flags override brief
    if "title" in opts:
        book_meta["title"] = opts["title"]
    if "author" in opts:
        book_meta["author"] = opts["author"]
    if "subtitle" in opts:
        book_meta["subtitle"] = opts["subtitle"]
    if "goal" in opts:
        book_meta["target_words"] = str(opts["goal"])

    chapters: list[dict] = []

    for path in sorted(input_paths):
        if not os.path.isfile(path):
            print(f"Warning: '{path}' not found, skipping.")
            continue
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()
        fm, body = parse_frontmatter(raw)

        # Determine chapter number from frontmatter or filename
        ch_num = None
        if "chapter" in fm:
            try:
                ch_num = int(fm["chapter"])
            except ValueError:
                pass
        if ch_num is None:
            m = re.search(r"ch[_-]?(\d+)", os.path.basename(path), re.IGNORECASE)
            if m:
                ch_num = int(m.group(1))
        if ch_num is None:
            ch_num = len(chapters) + 1

        chapter = build_chapter(ch_num, fm, body)
        chapters.append(chapter)

    # Sort chapters by order
    chapters.sort(key=lambda c: c["order"])

    # Re-number IDs after sorting
    for i, ch in enumerate(chapters):
        ch["id"] = f"ch-{i + 1:02d}"
        ch["order"] = i
        for j, sc in enumerate(ch["scenes"]):
            sc["id"] = f"sc-{i + 1:02d}-{j + 1:02d}"

    # Determine book-level metadata
    book_title = book_meta.get("title", "Untitled Book")
    book_author = book_meta.get("author", book_meta.get("pen_name", "Unknown Author"))
    book_subtitle = book_meta.get("subtitle", "")
    book_goal = int(book_meta.get("target_words", book_meta.get("word_count_goal", 80000)))

    book = build_storyforge(
        chapters,
        title=book_title,
        author=book_author,
        subtitle=book_subtitle,
        word_count_goal=book_goal,
    )

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(book, f, indent=2, ensure_ascii=False)

    total_wc = sum(sum(s["wordCount"] for s in ch["scenes"]) for ch in chapters)
    print(f"Written: {output_path}")
    print(f"  Title:    {book_title}")
    print(f"  Author:   {book_author}")
    print(f"  Chapters: {len(chapters)}")
    print(f"  Words:    {total_wc:,}")
    print(f"  Goal:     {book_goal:,}")


if __name__ == "__main__":
    main()
