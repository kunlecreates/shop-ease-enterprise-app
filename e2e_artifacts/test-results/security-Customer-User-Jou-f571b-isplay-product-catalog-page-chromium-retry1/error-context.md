# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - link "ShopEase" [ref=e6] [cursor=pointer]:
          - /url: /
        - link "Products" [ref=e7] [cursor=pointer]:
          - /url: /products
      - generic [ref=e8]:
        - link [ref=e9] [cursor=pointer]:
          - /url: /cart
          - img [ref=e10]
        - link "Login" [ref=e12] [cursor=pointer]:
          - /url: /login
        - link "Register" [ref=e13] [cursor=pointer]:
          - /url: /register
  - main [ref=e14]:
    - heading "Products" [level=1] [ref=e15]
    - generic [ref=e17]:
      - textbox "Search by name or SKU..." [ref=e19]
      - combobox [ref=e20]:
        - option "All Categories" [selected]
      - combobox [ref=e21]:
        - option "Sort by Name" [selected]
        - 'option "Price: Low to High"'
        - 'option "Price: High to Low"'
    - paragraph [ref=e22]: "Error: HTTP 502"
  - alert [ref=e23]
```