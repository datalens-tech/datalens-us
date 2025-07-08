```sql
CREATE TABLE orders (
    order_id BIGINT DEFAULT get_id() PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_id BIGINT NOT NULL,

    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE
);

CREATE TABLE shipments (
    shipment_id BIGINT DEFAULT get_id() PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,

    CONSTRAINT fk_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE RESTRICT
);

CREATE TABLE customers (
    customer_id BIGINT DEFAULT get_id() PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE products (
    product_id BIGINT DEFAULT get_id() PRIMARY KEY,
    name TEXT NOT NULL
);
```