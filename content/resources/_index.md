---
title: "Resources"
description: "Minimalistic, simple and clean tools for your personal growth."
date: 2026-05-17
draft: false

# 1. Route this section page directly to your custom layouts/resources/list.html grid engine
layout: "list"

# 2. Inherit front-matter properties down to all individual resource items inside this folder
cascade:
  # Forces child resource pages (e.g., tool-1.md) to render as standard text posts via layouts/_default/single.html
  # This prevents Hugo from looping them into the pagination compiler, eliminating Vercel build failures.
  layout: "single"
---