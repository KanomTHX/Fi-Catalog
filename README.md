# AKK-Stock

Create a modern web application for Inventory and Stock Management suitable for small to medium businesses.

Core Concept:

The system focuses on simple product creation, stock receiving, and stock withdrawal for selling.

Core Features:

1. Dashboard

- Display total number of products

- Total stock quantity

- Low stock alerts

- Recent stock movements

- Summary cards for Stock In and Stock Out

- Charts showing stock movement trends

2. Product Management

- Add / Edit / Delete products

- Product fields:

  - Product Name

  - SKU

  - Barcode

  - Category

  - Cost Price

  - Selling Price

  - Unit

  - Minimum Stock Level

  - Current Stock Quantity (auto calculated)

- Upload product images

- Search and filter products

- Import products via CSV / Excel

3. Stock Receiving (Stock In)

- Simple form to receive products into inventory

- Select product

- Enter quantity received

- Optional note field

- Automatically update stock quantity

- Record history of stock receiving

4. Stock Withdrawal (Stock Out)

- Withdraw products for selling

- Select product

- Enter quantity withdrawn

- Optional note (customer name or order reference)

- Automatically deduct stock

- Record withdrawal history

5. Stock Adjustment

- Manual stock correction

- Add or deduct stock with reason

- Full audit log

6. Warehouse / Location Management

- Support multiple storage locations

- Track stock by location

7. Reports

- Inventory report

- Low stock report

- Stock movement report

- Product stock summary

- Export reports to Excel or PDF

8. Notifications

- Alert when stock goes below minimum level

9. User Management

- Admin

- Staff

- Role-based permissions

10. Activity Logs

- Record all important system activities

UI / UX Requirements:

- Modern SaaS dashboard layout

- Responsive design (desktop + mobile)

- Sidebar navigation

- Data tables with search, filters, pagination

- Cards and charts for dashboard statistics

Tech Requirements:

- React frontend

- Node.js backend

- PostgreSQL database

- REST API architecture

- Secure authentication system

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://akk-show.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/809f3f0f-ada2-499f-9825-016dc98609a2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
