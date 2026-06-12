# Content Revamp Drafts

This folder is used for drafting and refining content updates before they are merged into the live site.

## Purpose
- **Safe Drafting:** Files here are pushed to GitHub but are **NOT** included in the production build (since they are outside the `src/` folder).
- **Comparison:** Use these `.md` files to compare against the live `.mdx` files in `src/content/posts`.

## Workflow
1. **Create Draft:** Add a new `.md` file in the subfolders (e.g., `posts/`) with your revamped content.
2. **Review & Compare:** Use a diff tool or VS Code side-by-side view to compare the draft with the current live post in `src/content/`.
3. **Merge:** Manually copy the approved changes from the `.md` draft into the corresponding `.mdx` file in `src/content/`.
4. **Cleanup:** After merging, you can delete the draft or move it to an `archived` folder.

## Folder Structure
- `/posts/`: Drafts for blog posts.
- `/archived/`: (Optional) Move completed drafts here for future reference.
