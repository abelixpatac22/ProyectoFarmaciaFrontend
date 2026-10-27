# Product

## Platform

web

## Users

Primary audience today: the professor and evaluators of a university web-programming course. There are no real customers. The store must still look and behave like a real Guatemalan online pharmacy, because that is what it is judged as.

The simulated shopper it is designed for: an adult in Guatemala buying everyday medicines and personal-care products, often on a phone. They may distrust buying medicine online and need clear prices, stock and prescription information before paying.

Secondary audience: pharmacy staff using the admin panel (`/admin`) to manage products, clients, suppliers, employees and invoices.

## Product Purpose

An online storefront and admin panel for a pharmacy: browse a catalog, view a product, keep a cart in the browser, check out with invoice data (NIT or "CF") and pay by card through Stripe. Success means the evaluators can complete a purchase end to end and the store reads as trustworthy and professional.

## Capabilities and Constraints

- React + Vite + TypeScript + Tailwind CSS v4 + React Router + TanStack Query. The backend is a separate Express/Sequelize/PostgreSQL project hosted on Render's free tier, so the first request can take about 50 s.
- Prices are in quetzales (GTQ) with IVA included (12%), broken down at checkout.
- Products have a name, description, barcode, sale price, stock, minimum stock and a "requires prescription" flag. There is no product image or category in the backend yet; `ProductImage` draws a placeholder.
- There is no login yet. Checkout looks the client up by NIT.
- Products are never deleted, only deactivated.
- Visual and motion work must not change business logic or API calls.

## Brand Commitments

- Name: still undecided. The store is called "Farmacia". Do not invent a brand name.
- Voice: Spanish (Guatemala), using "tú". Clear and calm; trustworthy and clean.
- Colors: not fixed. The user delegated the palette, with the only requirement that it reads as clean and trustworthy.

## Evidence on Hand

- No real logo, photography, testimonials, certifications, pharmacist names or addresses exist. Do not fabricate them.
- `public/favicon.svg` is the only brand asset.

## Product Principles

1. Trust comes from clarity: price, stock and prescription status are always visible and never ambiguous.
2. Honest states: loading, empty and error states are designed, including the slow first load on Render.
3. Never claim what the backend does not do: no delivery promises, no fake badges.
4. The store is the product; the admin panel is a tool and stays utilitarian.

## Accessibility & Inclusion

Mobile-first. Spanish only. Readable contrast (WCAG AA) and full keyboard use. Motion must respect `prefers-reduced-motion`.
