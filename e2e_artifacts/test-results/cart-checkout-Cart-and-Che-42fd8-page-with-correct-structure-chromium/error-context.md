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
    - img [ref=e15]
    - heading "Your cart is empty" [level=2] [ref=e17]
    - paragraph [ref=e18]: Add some products to get started
    - link "Browse Products" [ref=e19] [cursor=pointer]:
      - /url: /products
      - button "Browse Products" [ref=e20]
  - alert [ref=e21]
```