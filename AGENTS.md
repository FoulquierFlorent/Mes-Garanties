<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Calendar entries link to the existing item detail route and use the shared warranty date utilities, so all views calculate the same deadlines.
- Optional store and brand warranties use separate year-valued fields and the shared itemWarranties utility for deadlines; the existing primary warranty remains distinct to preserve saved durations and letter semantics.
- Problem reporting opens the letter editor on the item detail page; it does not assert eligibility or save a claim automatically.
- Receipt OCR is dynamically loaded in browser actions only; extracted text is stored as a text sidecar in the same private item folder to preserve household access restrictions.
