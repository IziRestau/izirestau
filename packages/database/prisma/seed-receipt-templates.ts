import { PrismaClient, ReceiptType } from '@prisma/client'

const prisma = new PrismaClient()

// Template HTML Classique
const classicHtmlTemplate = `
<div class="receipt classic">
  <header class="receipt-header">
    {% if settings.logo %}
      <img src="{{ settings.logo }}" alt="{{ restaurant.name }}" class="logo" />
    {% endif %}
    <h1 class="restaurant-name">{{ restaurant.name }}</h1>
    <p class="restaurant-address">{{ restaurant.address }}</p>
    <p class="restaurant-city">{{ restaurant.postalCode }} {{ restaurant.city }}</p>
    <p class="restaurant-phone">Tél: {{ restaurant.phone }}</p>
    {% if restaurant.siret %}
      <p class="restaurant-siret">SIRET: {{ restaurant.siret }}</p>
    {% endif %}
    {% if restaurant.vatNumber %}
      <p class="restaurant-vat">TVA: {{ restaurant.vatNumber }}</p>
    {% endif %}
  </header>

  <div class="receipt-divider"></div>

  <div class="receipt-info">
    <p class="receipt-number">Ticket N° {{ receipt.receiptNumber }}</p>
    <p class="receipt-date">{{ receipt.createdAt | date: "%d/%m/%Y à %H:%M" }}</p>
    {% if order.serviceType %}
      <p class="service-type">{{ order.serviceType | service_type }}</p>
    {% endif %}
    {% if cashier %}
      <p class="cashier">Caissier: {{ cashier.firstName }} {{ cashier.lastName | slice: 0 }}.</p>
    {% endif %}
  </div>

  <div class="receipt-divider"></div>

  <table class="items-table">
    <tbody>
      {% for item in items %}
      <tr class="item-row">
        <td class="item-qty">{{ item.quantity }}x</td>
        <td class="item-name">{{ item.name }}</td>
        <td class="item-price">{{ item.total | money }}</td>
      </tr>
      {% if item.modifiers.size > 0 %}
        {% for mod in item.modifiers %}
        <tr class="modifier-row">
          <td></td>
          <td class="modifier-name">+ {{ mod.name }}</td>
          <td class="modifier-price">{% if mod.price > 0 %}{{ mod.price | money }}{% endif %}</td>
        </tr>
        {% endfor %}
      {% endif %}
      {% if item.notes %}
        <tr class="notes-row">
          <td></td>
          <td colspan="2" class="item-notes">{{ item.notes }}</td>
        </tr>
      {% endif %}
      {% endfor %}
    </tbody>
  </table>

  <div class="receipt-divider"></div>

  <div class="totals">
    <div class="total-row">
      <span class="total-label">Sous-total HT</span>
      <span class="total-value">{{ totals.subtotalHT | money }}</span>
    </div>
    {% for tax in totals.taxes %}
    <div class="total-row tax-row">
      <span class="total-label">TVA {{ tax.rate }}%</span>
      <span class="total-value">{{ tax.amount | money }}</span>
    </div>
    {% endfor %}
    {% if totals.discount > 0 %}
    <div class="total-row discount-row">
      <span class="total-label">Remise</span>
      <span class="total-value">-{{ totals.discount | money }}</span>
    </div>
    {% endif %}
    {% if totals.deliveryFee > 0 %}
    <div class="total-row">
      <span class="total-label">Livraison</span>
      <span class="total-value">{{ totals.deliveryFee | money }}</span>
    </div>
    {% endif %}
    {% if totals.tip > 0 %}
    <div class="total-row">
      <span class="total-label">Pourboire</span>
      <span class="total-value">{{ totals.tip | money }}</span>
    </div>
    {% endif %}
    <div class="total-row total-final">
      <span class="total-label">TOTAL TTC</span>
      <span class="total-value">{{ totals.total | money }}</span>
    </div>
    <div class="total-row payment-row">
      <span class="total-label">{{ order.paymentMethod | payment_method }}</span>
      <span class="total-value">{{ totals.total | money }}</span>
    </div>
  </div>

  {% if settings.showQrCode and qrCodeUrl %}
  <div class="qrcode-section">
    <img src="{{ qrCodeUrl }}" alt="QR Code" class="qrcode" />
  </div>
  {% endif %}

  <footer class="receipt-footer">
    <p class="thank-you">{{ settings.thankYouMessage | default: "Merci de votre visite !" }}</p>
    {% if settings.footerText %}
      <p class="footer-text">{{ settings.footerText }}</p>
    {% endif %}
    {% if receipt.signature %}
      <p class="signature">Sig: {{ receipt.signature | truncate: 16 }}</p>
    {% endif %}
  </footer>
</div>
`

const classicCssStyles = `
.receipt.classic {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
  max-width: 300px;
  margin: 0 auto;
  padding: 10px;
  background: white;
  color: #000;
}

.receipt-header {
  text-align: center;
  margin-bottom: 10px;
}

.receipt-header .logo {
  max-width: 120px;
  max-height: 60px;
  margin-bottom: 8px;
}

.restaurant-name {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 5px 0;
}

.receipt-header p {
  margin: 2px 0;
  font-size: 11px;
}

.receipt-divider {
  border-top: 1px dashed #000;
  margin: 8px 0;
}

.receipt-info {
  text-align: center;
  margin-bottom: 10px;
}

.receipt-info p {
  margin: 2px 0;
}

.receipt-number {
  font-weight: bold;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.item-row td {
  padding: 3px 0;
  vertical-align: top;
}

.item-qty {
  width: 30px;
}

.item-name {
  flex: 1;
}

.item-price {
  text-align: right;
  white-space: nowrap;
}

.modifier-row td {
  font-size: 10px;
  color: #555;
  padding: 1px 0;
}

.modifier-name {
  padding-left: 10px;
}

.notes-row .item-notes {
  font-size: 10px;
  font-style: italic;
  color: #666;
}

.totals {
  margin-top: 10px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.total-final {
  font-weight: bold;
  font-size: 14px;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 5px 0;
  margin: 5px 0;
}

.discount-row .total-value {
  color: #c00;
}

.qrcode-section {
  text-align: center;
  margin: 15px 0;
}

.qrcode {
  width: 80px;
  height: 80px;
}

.receipt-footer {
  text-align: center;
  margin-top: 15px;
  font-size: 11px;
}

.thank-you {
  font-weight: bold;
  margin-bottom: 5px;
}

.footer-text {
  color: #666;
  font-size: 10px;
}

.signature {
  font-size: 9px;
  color: #999;
  margin-top: 10px;
}

@media print {
  .receipt.classic {
    max-width: 100%;
    padding: 0;
  }
}
`

// Template HTML Moderne
const modernHtmlTemplate = `
<div class="receipt modern" style="--primary-color: {{ settings.primaryColor | default: '#10b981' }}">
  <header class="receipt-header">
    {% if settings.logo %}
      <img src="{{ settings.logo }}" alt="{{ restaurant.name }}" class="logo" />
    {% else %}
      <div class="logo-placeholder" style="background-color: var(--primary-color)">
        {{ restaurant.name | slice: 0 }}
      </div>
    {% endif %}
    <h1 class="restaurant-name">{{ restaurant.name }}</h1>
    <p class="restaurant-info">{{ restaurant.address }}, {{ restaurant.postalCode }} {{ restaurant.city }}</p>
    <p class="restaurant-info">{{ restaurant.phone }}</p>
  </header>

  <div class="receipt-meta">
    <div class="meta-item">
      <span class="meta-label">Ticket</span>
      <span class="meta-value">{{ receipt.receiptNumber }}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Date</span>
      <span class="meta-value">{{ receipt.createdAt | date: "%d/%m/%Y %H:%M" }}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Type</span>
      <span class="meta-value">{{ order.serviceType | service_type }}</span>
    </div>
  </div>

  <div class="items-section">
    {% for item in items %}
    <div class="item">
      <div class="item-main">
        <span class="item-qty">{{ item.quantity }}×</span>
        <span class="item-name">{{ item.name }}</span>
        <span class="item-price">{{ item.total | money }}</span>
      </div>
      {% if item.modifiers.size > 0 %}
        {% for mod in item.modifiers %}
        <div class="item-modifier">
          <span>+ {{ mod.name }}</span>
          {% if mod.price > 0 %}<span>{{ mod.price | money }}</span>{% endif %}
        </div>
        {% endfor %}
      {% endif %}
    </div>
    {% endfor %}
  </div>

  <div class="totals-section">
    <div class="total-line">
      <span>Sous-total</span>
      <span>{{ totals.subtotal | money }}</span>
    </div>
    {% for tax in totals.taxes %}
    <div class="total-line tax">
      <span>TVA {{ tax.rate }}%</span>
      <span>{{ tax.amount | money }}</span>
    </div>
    {% endfor %}
    {% if totals.discount > 0 %}
    <div class="total-line discount">
      <span>Remise</span>
      <span>-{{ totals.discount | money }}</span>
    </div>
    {% endif %}
    <div class="total-line final">
      <span>Total</span>
      <span>{{ totals.total | money }}</span>
    </div>
    <div class="payment-badge" style="background-color: var(--primary-color)">
      {{ order.paymentMethod | payment_method }}
    </div>
  </div>

  {% if settings.showQrCode and qrCodeUrl %}
  <div class="qrcode-section">
    <img src="{{ qrCodeUrl }}" alt="QR Code" />
  </div>
  {% endif %}

  <footer class="receipt-footer">
    <p class="thank-you">{{ settings.thankYouMessage | default: "Merci de votre visite !" }}</p>
    {% if restaurant.siret %}
      <p class="legal">SIRET: {{ restaurant.siret }}{% if restaurant.vatNumber %} - TVA: {{ restaurant.vatNumber }}{% endif %}</p>
    {% endif %}
  </footer>
</div>
`

const modernCssStyles = `
.receipt.modern {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  max-width: 320px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  color: #1f2937;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.receipt-header {
  text-align: center;
  margin-bottom: 20px;
}

.receipt-header .logo {
  max-width: 100px;
  max-height: 50px;
  margin-bottom: 12px;
}

.logo-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 12px;
}

.restaurant-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #111827;
}

.restaurant-info {
  margin: 2px 0;
  color: #6b7280;
  font-size: 12px;
}

.receipt-meta {
  display: flex;
  justify-content: space-between;
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.meta-item {
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-top: 2px;
}

.items-section {
  margin-bottom: 20px;
}

.item {
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.item:last-child {
  border-bottom: none;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-qty {
  color: var(--primary-color);
  font-weight: 600;
  min-width: 30px;
}

.item-name {
  flex: 1;
  font-weight: 500;
}

.item-price {
  font-weight: 600;
}

.item-modifier {
  display: flex;
  justify-content: space-between;
  padding-left: 38px;
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.totals-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.total-line {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  color: #6b7280;
}

.total-line.final {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  border-top: 2px solid #e5e7eb;
  margin-top: 8px;
  padding-top: 12px;
}

.total-line.discount span:last-child {
  color: #dc2626;
}

.payment-badge {
  display: inline-block;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 12px;
}

.qrcode-section {
  text-align: center;
  margin: 20px 0;
}

.qrcode-section img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
}

.receipt-footer {
  text-align: center;
}

.thank-you {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.legal {
  font-size: 10px;
  color: #9ca3af;
}

@media print {
  .receipt.modern {
    box-shadow: none;
    max-width: 100%;
  }
}
`

// Template Minimaliste
const minimalHtmlTemplate = `
<div class="receipt minimal">
  <header>
    <h1>{{ restaurant.name }}</h1>
    <p>{{ receipt.receiptNumber }} • {{ receipt.createdAt | date: "%d/%m/%Y %H:%M" }}</p>
  </header>

  <div class="items">
    {% for item in items %}
    <div class="item">
      <span>{{ item.quantity }}× {{ item.name }}</span>
      <span>{{ item.total | money }}</span>
    </div>
    {% endfor %}
  </div>

  <div class="total">
    <span>Total</span>
    <span>{{ totals.total | money }}</span>
  </div>

  <footer>
    <p>{{ settings.thankYouMessage | default: "Merci !" }}</p>
  </footer>
</div>
`

const minimalCssStyles = `
.receipt.minimal {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  max-width: 280px;
  margin: 0 auto;
  padding: 20px;
  background: white;
}

.receipt.minimal header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.receipt.minimal h1 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.receipt.minimal header p {
  font-size: 11px;
  color: #888;
  margin: 0;
}

.receipt.minimal .items {
  margin-bottom: 15px;
}

.receipt.minimal .item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.receipt.minimal .total {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  padding: 15px 0;
  border-top: 2px solid #000;
}

.receipt.minimal footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}
`

// Template Thermique 58mm
const thermal58HtmlTemplate = `
<div class="receipt thermal-58">
  <div class="center">
    <strong>{{ restaurant.name }}</strong>
  </div>
  <div class="center small">
    {{ restaurant.address }}
    {{ restaurant.postalCode }} {{ restaurant.city }}
    Tél: {{ restaurant.phone }}
  </div>
  {% if restaurant.siret %}
  <div class="center small">SIRET: {{ restaurant.siret }}</div>
  {% endif %}
  
  <div class="separator">--------------------------------</div>
  
  <div class="center">
    Ticket {{ receipt.receiptNumber }}
    {{ receipt.createdAt | date: "%d/%m/%Y %H:%M" }}
  </div>
  
  <div class="separator">--------------------------------</div>
  
  {% for item in items %}
  <div class="line">
    <span>{{ item.quantity }}x {{ item.name | truncate: 18 }}</span>
    <span>{{ item.total | money_short }}</span>
  </div>
  {% if item.modifiers.size > 0 %}
    {% for mod in item.modifiers %}
  <div class="line small indent">
    <span>+ {{ mod.name | truncate: 16 }}</span>
    <span>{% if mod.price > 0 %}{{ mod.price | money_short }}{% endif %}</span>
  </div>
    {% endfor %}
  {% endif %}
  {% endfor %}
  
  <div class="separator">--------------------------------</div>
  
  {% for tax in totals.taxes %}
  <div class="line small">
    <span>TVA {{ tax.rate }}%</span>
    <span>{{ tax.amount | money_short }}</span>
  </div>
  {% endfor %}
  
  <div class="line bold">
    <span>TOTAL</span>
    <span>{{ totals.total | money_short }}</span>
  </div>
  
  <div class="line">
    <span>{{ order.paymentMethod | payment_method }}</span>
    <span>{{ totals.total | money_short }}</span>
  </div>
  
  <div class="separator">--------------------------------</div>
  
  <div class="center">
    {{ settings.thankYouMessage | default: "Merci de votre visite !" }}
  </div>
  
  {% if receipt.signature %}
  <div class="center small">Sig: {{ receipt.signature | truncate: 16 }}</div>
  {% endif %}
</div>
`

const thermal58CssStyles = `
.receipt.thermal-58 {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  width: 48mm;
  padding: 2mm;
  background: white;
  color: #000;
}

.receipt.thermal-58 .center {
  text-align: center;
}

.receipt.thermal-58 .small {
  font-size: 10px;
}

.receipt.thermal-58 .bold {
  font-weight: bold;
}

.receipt.thermal-58 .separator {
  text-align: center;
  margin: 3px 0;
}

.receipt.thermal-58 .line {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
}

.receipt.thermal-58 .indent {
  padding-left: 8px;
}

@media print {
  .receipt.thermal-58 {
    width: 48mm;
  }
}
`

// Template Thermique 80mm
const thermal80HtmlTemplate = `
<div class="receipt thermal-80">
  <div class="header">
    {% if settings.logo %}
    <img src="{{ settings.logo }}" alt="{{ restaurant.name }}" class="logo" />
    {% endif %}
    <div class="restaurant-name">{{ restaurant.name }}</div>
    <div class="restaurant-info">
      {{ restaurant.address }}, {{ restaurant.postalCode }} {{ restaurant.city }}
    </div>
    <div class="restaurant-info">Tél: {{ restaurant.phone }}</div>
    {% if restaurant.siret %}
    <div class="restaurant-info">SIRET: {{ restaurant.siret }}{% if restaurant.vatNumber %} - TVA: {{ restaurant.vatNumber }}{% endif %}</div>
    {% endif %}
  </div>
  
  <div class="divider">================================================</div>
  
  <div class="ticket-info">
    <div class="info-line">
      <span>Ticket N°</span>
      <span>{{ receipt.receiptNumber }}</span>
    </div>
    <div class="info-line">
      <span>Date</span>
      <span>{{ receipt.createdAt | date: "%d/%m/%Y %H:%M" }}</span>
    </div>
    <div class="info-line">
      <span>Type</span>
      <span>{{ order.serviceType | service_type }}</span>
    </div>
    {% if cashier %}
    <div class="info-line">
      <span>Caissier</span>
      <span>{{ cashier.firstName }} {{ cashier.lastName | slice: 0 }}.</span>
    </div>
    {% endif %}
  </div>
  
  <div class="divider">================================================</div>
  
  <div class="items">
    {% for item in items %}
    <div class="item-line">
      <span class="item-qty">{{ item.quantity }}x</span>
      <span class="item-name">{{ item.name }}</span>
      <span class="item-price">{{ item.total | money }}</span>
    </div>
    {% if item.modifiers.size > 0 %}
      {% for mod in item.modifiers %}
    <div class="modifier-line">
      <span></span>
      <span>+ {{ mod.name }}</span>
      <span>{% if mod.price > 0 %}{{ mod.price | money }}{% endif %}</span>
    </div>
      {% endfor %}
    {% endif %}
    {% endfor %}
  </div>
  
  <div class="divider">================================================</div>
  
  <div class="totals">
    <div class="total-line">
      <span>Sous-total HT</span>
      <span>{{ totals.subtotalHT | money }}</span>
    </div>
    {% for tax in totals.taxes %}
    <div class="total-line">
      <span>TVA {{ tax.rate }}%</span>
      <span>{{ tax.amount | money }}</span>
    </div>
    {% endfor %}
    {% if totals.discount > 0 %}
    <div class="total-line">
      <span>Remise</span>
      <span>-{{ totals.discount | money }}</span>
    </div>
    {% endif %}
    <div class="total-line total-final">
      <span>TOTAL TTC</span>
      <span>{{ totals.total | money }}</span>
    </div>
    <div class="total-line">
      <span>{{ order.paymentMethod | payment_method }}</span>
      <span>{{ totals.total | money }}</span>
    </div>
  </div>
  
  <div class="divider">================================================</div>
  
  {% if settings.showQrCode and qrCodeUrl %}
  <div class="qrcode">
    <img src="{{ qrCodeUrl }}" alt="QR Code" />
  </div>
  {% endif %}
  
  <div class="footer">
    <div class="thank-you">{{ settings.thankYouMessage | default: "Merci de votre visite !" }}</div>
    {% if settings.footerText %}
    <div class="footer-text">{{ settings.footerText }}</div>
    {% endif %}
    {% if receipt.signature %}
    <div class="signature">Signature: {{ receipt.signature | truncate: 20 }}</div>
    {% endif %}
  </div>
</div>
`

const thermal80CssStyles = `
.receipt.thermal-80 {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  width: 72mm;
  padding: 3mm;
  background: white;
  color: #000;
}

.receipt.thermal-80 .header {
  text-align: center;
  margin-bottom: 5px;
}

.receipt.thermal-80 .logo {
  max-width: 50mm;
  max-height: 20mm;
  margin-bottom: 5px;
}

.receipt.thermal-80 .restaurant-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 3px;
}

.receipt.thermal-80 .restaurant-info {
  font-size: 10px;
}

.receipt.thermal-80 .divider {
  text-align: center;
  margin: 5px 0;
  font-size: 10px;
}

.receipt.thermal-80 .ticket-info {
  margin: 5px 0;
}

.receipt.thermal-80 .info-line {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.receipt.thermal-80 .items {
  margin: 5px 0;
}

.receipt.thermal-80 .item-line {
  display: flex;
  margin: 3px 0;
}

.receipt.thermal-80 .item-qty {
  width: 25px;
}

.receipt.thermal-80 .item-name {
  flex: 1;
}

.receipt.thermal-80 .item-price {
  text-align: right;
  min-width: 60px;
}

.receipt.thermal-80 .modifier-line {
  display: flex;
  font-size: 10px;
  color: #444;
  margin-left: 25px;
}

.receipt.thermal-80 .modifier-line span:nth-child(2) {
  flex: 1;
}

.receipt.thermal-80 .totals {
  margin: 5px 0;
}

.receipt.thermal-80 .total-line {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
}

.receipt.thermal-80 .total-final {
  font-weight: bold;
  font-size: 14px;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 3px 0;
  margin: 5px 0;
}

.receipt.thermal-80 .qrcode {
  text-align: center;
  margin: 10px 0;
}

.receipt.thermal-80 .qrcode img {
  width: 25mm;
  height: 25mm;
}

.receipt.thermal-80 .footer {
  text-align: center;
  margin-top: 10px;
}

.receipt.thermal-80 .thank-you {
  font-weight: bold;
  margin-bottom: 3px;
}

.receipt.thermal-80 .footer-text {
  font-size: 10px;
  color: #666;
}

.receipt.thermal-80 .signature {
  font-size: 9px;
  color: #888;
  margin-top: 5px;
}

@media print {
  .receipt.thermal-80 {
    width: 72mm;
  }
}
`

// Templates pour factures
const invoiceSimpleHtmlTemplate = `
<div class="invoice simple">
  <header class="invoice-header">
    <div class="company-info">
      {% if settings.logo %}
        <img src="{{ settings.logo }}" alt="{{ restaurant.name }}" class="logo" />
      {% endif %}
      <h1>{{ restaurant.name }}</h1>
      <p>{{ restaurant.address }}</p>
      <p>{{ restaurant.postalCode }} {{ restaurant.city }}</p>
      <p>Tél: {{ restaurant.phone }}</p>
      {% if restaurant.email %}<p>{{ restaurant.email }}</p>{% endif %}
    </div>
    <div class="invoice-info">
      <h2>FACTURE SIMPLIFIÉE</h2>
      <p><strong>N°</strong> {{ receipt.receiptNumber }}</p>
      <p><strong>Date</strong> {{ receipt.createdAt | date: "%d/%m/%Y" }}</p>
    </div>
  </header>

  <div class="legal-info">
    {% if restaurant.siret %}<p>SIRET: {{ restaurant.siret }}</p>{% endif %}
    {% if restaurant.vatNumber %}<p>N° TVA: {{ restaurant.vatNumber }}</p>{% endif %}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Désignation</th>
        <th>Qté</th>
        <th>P.U. HT</th>
        <th>Total HT</th>
      </tr>
    </thead>
    <tbody>
      {% for item in items %}
      <tr>
        <td>{{ item.name }}{% if item.modifiers.size > 0 %}<br><small>{% for mod in item.modifiers %}+ {{ mod.name }}{% unless forloop.last %}, {% endunless %}{% endfor %}</small>{% endif %}</td>
        <td>{{ item.quantity }}</td>
        <td>{{ item.unitPriceHT | money }}</td>
        <td>{{ item.totalHT | money }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="total-row">
        <span>Total HT</span>
        <span>{{ totals.subtotalHT | money }}</span>
      </div>
      {% for tax in totals.taxes %}
      <div class="total-row">
        <span>TVA {{ tax.rate }}%</span>
        <span>{{ tax.amount | money }}</span>
      </div>
      {% endfor %}
      {% if totals.discount > 0 %}
      <div class="total-row discount">
        <span>Remise</span>
        <span>-{{ totals.discount | money }}</span>
      </div>
      {% endif %}
      <div class="total-row final">
        <span>Total TTC</span>
        <span>{{ totals.total | money }}</span>
      </div>
    </div>
  </div>

  <div class="payment-info">
    <p>Réglé par {{ order.paymentMethod | payment_method }} le {{ receipt.createdAt | date: "%d/%m/%Y" }}</p>
  </div>

  <footer class="invoice-footer">
    <p>{{ settings.thankYouMessage | default: "Merci de votre confiance !" }}</p>
    {% if settings.footerText %}<p class="legal-footer">{{ settings.footerText }}</p>{% endif %}
  </footer>
</div>
`

const invoiceSimpleCssStyles = `
.invoice.simple {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  max-width: 210mm;
  margin: 0 auto;
  padding: 20mm;
  background: white;
  color: #333;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.company-info .logo {
  max-width: 150px;
  max-height: 60px;
  margin-bottom: 10px;
}

.company-info h1 {
  font-size: 20px;
  margin: 0 0 10px 0;
}

.company-info p {
  margin: 3px 0;
  color: #666;
}

.invoice-info {
  text-align: right;
}

.invoice-info h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 15px 0;
}

.invoice-info p {
  margin: 5px 0;
}

.legal-info {
  background: #f9f9f9;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.legal-info p {
  margin: 3px 0;
  font-size: 11px;
  color: #666;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.items-table th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.items-table th:last-child,
.items-table td:last-child {
  text-align: right;
}

.items-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.items-table small {
  color: #888;
}

.totals {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30px;
}

.totals-table {
  width: 250px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.total-row.final {
  font-size: 16px;
  font-weight: bold;
  border-bottom: 2px solid #333;
  border-top: 2px solid #333;
  padding: 12px 0;
  margin-top: 10px;
}

.total-row.discount span:last-child {
  color: #c00;
}

.payment-info {
  background: #e8f5e9;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 30px;
}

.payment-info p {
  margin: 0;
  color: #2e7d32;
  font-weight: 500;
}

.invoice-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.invoice-footer p {
  margin: 5px 0;
}

.legal-footer {
  font-size: 10px;
  color: #999;
}

@media print {
  .invoice.simple {
    padding: 10mm;
  }
}
`

// Template Facture Simplifiée Moderne
const invoiceSimpleModernHtmlTemplate = `
<div class="invoice simple-modern" style="--primary-color: {{ settings.primaryColor | default: '#10b981' }}">
  <header class="invoice-header">
    <div class="company-block">
      {% if settings.logo %}
        <img src="{{ settings.logo }}" alt="{{ restaurant.name }}" class="logo" />
      {% else %}
        <div class="logo-placeholder" style="background: var(--primary-color)">{{ restaurant.name | slice: 0 }}</div>
      {% endif %}
      <div class="company-details">
        <h1>{{ restaurant.name }}</h1>
        <p>{{ restaurant.address }}</p>
        <p>{{ restaurant.postalCode }} {{ restaurant.city }}</p>
        <p>{{ restaurant.phone }}</p>
      </div>
    </div>
    <div class="invoice-badge" style="background: var(--primary-color)">
      <span class="badge-label">Facture Simplifiée</span>
      <span class="badge-number">{{ receipt.receiptNumber }}</span>
    </div>
  </header>

  <div class="invoice-meta">
    <div class="meta-card">
      <span class="meta-label">Date</span>
      <span class="meta-value">{{ receipt.createdAt | date: "%d/%m/%Y" }}</span>
    </div>
    <div class="meta-card">
      <span class="meta-label">Heure</span>
      <span class="meta-value">{{ receipt.createdAt | date: "%H:%M" }}</span>
    </div>
    <div class="meta-card">
      <span class="meta-label">Type</span>
      <span class="meta-value">{{ order.serviceType | service_type }}</span>
    </div>
  </div>

  <div class="items-section">
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-desc">Description</th>
          <th class="col-qty">Qté</th>
          <th class="col-price">P.U.</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>{{ item.name }}</td>
          <td class="center">{{ item.quantity }}</td>
          <td class="right">{{ item.unitPrice | money }}</td>
          <td class="right">{{ item.total | money }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>

  <div class="totals-section">
    <div class="totals-grid">
      <div class="total-line">
        <span>Sous-total HT</span>
        <span>{{ totals.subtotalHT | money }}</span>
      </div>
      {% for tax in totals.taxes %}
      <div class="total-line">
        <span>TVA {{ tax.rate }}%</span>
        <span>{{ tax.amount | money }}</span>
      </div>
      {% endfor %}
      <div class="total-line final" style="background: var(--primary-color)">
        <span>Total TTC</span>
        <span>{{ totals.total | money }}</span>
      </div>
    </div>
  </div>

  <div class="payment-section">
    <div class="payment-badge">
      Réglé par {{ order.paymentMethod | payment_method }}
    </div>
  </div>

  <footer class="invoice-footer">
    {% if restaurant.siret %}<p>SIRET: {{ restaurant.siret }}{% if restaurant.vatNumber %} - TVA: {{ restaurant.vatNumber }}{% endif %}</p>{% endif %}
    <p class="thank-you">{{ settings.thankYouMessage | default: "Merci de votre confiance !" }}</p>
  </footer>
</div>
`

const invoiceSimpleModernCssStyles = `
.invoice.simple-modern {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  max-width: 210mm;
  margin: 0 auto;
  padding: 25mm;
  background: white;
  color: #1f2937;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.company-block {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.company-block .logo {
  max-width: 80px;
  max-height: 80px;
  border-radius: 12px;
}

.logo-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.company-details h1 {
  font-size: 20px;
  margin: 0 0 8px 0;
}

.company-details p {
  margin: 2px 0;
  color: #6b7280;
  font-size: 12px;
}

.invoice-badge {
  text-align: center;
  padding: 15px 25px;
  border-radius: 12px;
  color: white;
}

.badge-label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
}

.badge-number {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-top: 5px;
}

.invoice-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.meta-card {
  flex: 1;
  background: #f9fafb;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  display: block;
  font-weight: 600;
  margin-top: 5px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.items-table th {
  background: #f3f4f6;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
}

.items-table td {
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
}

.items-table .center { text-align: center; }
.items-table .right { text-align: right; }

.totals-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30px;
}

.totals-grid {
  width: 280px;
}

.total-line {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  border-bottom: 1px solid #f3f4f6;
}

.total-line.final {
  color: white;
  font-weight: 700;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  margin-top: 10px;
}

.payment-section {
  text-align: center;
  margin-bottom: 30px;
}

.payment-badge {
  display: inline-block;
  background: #dcfce7;
  color: #166534;
  padding: 10px 25px;
  border-radius: 25px;
  font-weight: 500;
}

.invoice-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.invoice-footer p {
  margin: 5px 0;
  font-size: 11px;
  color: #9ca3af;
}

.thank-you {
  font-weight: 600;
  color: var(--primary-color) !important;
  font-size: 13px !important;
}
`

// Template Facture Complète
const invoiceFullHtmlTemplate = `
<div class="invoice full">
  <header class="invoice-header">
    <div class="company-info">
      {% if settings.logo %}
        <img src="{{ settings.logo }}" alt="{{ restaurant.name }}" class="logo" />
      {% endif %}
      <h1>{{ restaurant.name }}</h1>
      <p>{{ restaurant.address }}</p>
      {% if restaurant.addressLine2 %}<p>{{ restaurant.addressLine2 }}</p>{% endif %}
      <p>{{ restaurant.postalCode }} {{ restaurant.city }}</p>
      <p>Tél: {{ restaurant.phone }}</p>
      {% if restaurant.email %}<p>{{ restaurant.email }}</p>{% endif %}
    </div>
    <div class="invoice-info">
      <h2>FACTURE</h2>
      <table class="info-table">
        <tr><td>N° Facture</td><td>{{ receipt.receiptNumber }}</td></tr>
        <tr><td>Date</td><td>{{ receipt.createdAt | date: "%d/%m/%Y" }}</td></tr>
        <tr><td>Échéance</td><td>{{ receipt.createdAt | date: "%d/%m/%Y" }}</td></tr>
      </table>
    </div>
  </header>

  <div class="parties">
    <div class="seller">
      <h3>Émetteur</h3>
      <p><strong>{{ restaurant.name }}</strong></p>
      <p>{{ restaurant.address }}</p>
      <p>{{ restaurant.postalCode }} {{ restaurant.city }}</p>
      {% if restaurant.siret %}<p>SIRET: {{ restaurant.siret }}</p>{% endif %}
      {% if restaurant.vatNumber %}<p>N° TVA: {{ restaurant.vatNumber }}</p>{% endif %}
    </div>
    <div class="buyer">
      <h3>Client</h3>
      {% if customer %}
        <p><strong>{{ customer.name }}</strong></p>
        {% if customer.address %}<p>{{ customer.address }}</p>{% endif %}
        {% if customer.email %}<p>{{ customer.email }}</p>{% endif %}
        {% if customer.phone %}<p>{{ customer.phone }}</p>{% endif %}
      {% else %}
        <p>Client comptoir</p>
      {% endif %}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th class="col-ref">Réf.</th>
        <th class="col-desc">Désignation</th>
        <th class="col-qty">Qté</th>
        <th class="col-unit">P.U. HT</th>
        <th class="col-tva">TVA</th>
        <th class="col-total">Total HT</th>
      </tr>
    </thead>
    <tbody>
      {% for item in items %}
      <tr>
        <td>-</td>
        <td>{{ item.name }}{% if item.modifiers.size > 0 %}<br><small>{% for mod in item.modifiers %}+ {{ mod.name }}{% unless forloop.last %}, {% endunless %}{% endfor %}</small>{% endif %}</td>
        <td class="center">{{ item.quantity }}</td>
        <td class="right">{{ item.unitPriceHT | money }}</td>
        <td class="center">10%</td>
        <td class="right">{{ item.totalHT | money }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-table">
      <div class="total-row">
        <span>Total HT</span>
        <span>{{ totals.subtotalHT | money }}</span>
      </div>
      {% for tax in totals.taxes %}
      <div class="total-row">
        <span>TVA {{ tax.rate }}%</span>
        <span>{{ tax.amount | money }}</span>
      </div>
      {% endfor %}
      {% if totals.discount > 0 %}
      <div class="total-row discount">
        <span>Remise</span>
        <span>-{{ totals.discount | money }}</span>
      </div>
      {% endif %}
      <div class="total-row final">
        <span>Total TTC</span>
        <span>{{ totals.total | money }}</span>
      </div>
    </div>
  </div>

  <div class="payment-info">
    <h4>Conditions de règlement</h4>
    <p>Réglé par {{ order.paymentMethod | payment_method }} le {{ receipt.createdAt | date: "%d/%m/%Y" }}</p>
  </div>

  <footer class="invoice-footer">
    <p class="legal">{{ settings.footerText | default: "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée. Indemnité forfaitaire pour frais de recouvrement : 40€." }}</p>
    <p class="thank-you">{{ settings.thankYouMessage | default: "Merci de votre confiance !" }}</p>
  </footer>
</div>
`

const invoiceFullCssStyles = `
.invoice.full {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  max-width: 210mm;
  margin: 0 auto;
  padding: 20mm;
  background: white;
  color: #333;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
}

.company-info .logo {
  max-width: 150px;
  max-height: 60px;
  margin-bottom: 15px;
}

.company-info h1 {
  font-size: 22px;
  margin: 0 0 10px 0;
  color: #111;
}

.company-info p {
  margin: 3px 0;
  color: #666;
}

.invoice-info {
  text-align: right;
}

.invoice-info h2 {
  font-size: 28px;
  color: #111;
  margin: 0 0 20px 0;
  letter-spacing: 2px;
}

.info-table {
  margin-left: auto;
}

.info-table td {
  padding: 5px 0;
}

.info-table td:first-child {
  color: #888;
  padding-right: 20px;
}

.info-table td:last-child {
  font-weight: 600;
}

.parties {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.seller, .buyer {
  flex: 1;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.parties h3 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888;
  margin: 0 0 15px 0;
}

.parties p {
  margin: 5px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.items-table th {
  background: #1f2937;
  color: white;
  padding: 12px 15px;
  text-align: left;
  font-weight: 500;
  font-size: 11px;
}

.items-table th.col-qty,
.items-table th.col-tva { text-align: center; }

.items-table th.col-unit,
.items-table th.col-total { text-align: right; }

.items-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.items-table .center { text-align: center; }
.items-table .right { text-align: right; }

.items-table small {
  color: #888;
}

.totals-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 40px;
}

.totals-table {
  width: 300px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.total-row.final {
  font-size: 18px;
  font-weight: 700;
  border-top: 2px solid #1f2937;
  padding-top: 15px;
  margin-top: 10px;
}

.total-row.discount span:last-child {
  color: #dc2626;
}

.payment-info {
  background: #ecfdf5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 40px;
}

.payment-info h4 {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #065f46;
}

.payment-info p {
  margin: 0;
  color: #047857;
}

.invoice-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.legal {
  font-size: 9px;
  color: #999;
  margin-bottom: 15px;
}

.thank-you {
  font-weight: 600;
  color: #111;
}

@media print {
  .invoice.full {
    padding: 10mm;
  }
}
`

// Template Facture Complète Pro
const invoiceFullProHtmlTemplate = `
<div class="invoice full-pro" style="--primary-color: {{ settings.primaryColor | default: '#10b981' }}">
  <div class="header-bar" style="background: var(--primary-color)"></div>
  
  <header class="invoice-header">
    <div class="company-block">
      {% if settings.logo %}
        <img src="{{ settings.logo }}" alt="{{ restaurant.name }}" class="logo" />
      {% endif %}
      <div class="company-details">
        <h1>{{ restaurant.name }}</h1>
        <p>{{ restaurant.address }}, {{ restaurant.postalCode }} {{ restaurant.city }}</p>
        <p>{{ restaurant.phone }}{% if restaurant.email %} • {{ restaurant.email }}{% endif %}</p>
      </div>
    </div>
  </header>

  <div class="invoice-title">
    <h2>FACTURE</h2>
    <div class="invoice-number" style="color: var(--primary-color)">{{ receipt.receiptNumber }}</div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="info-icon" style="background: var(--primary-color)">📅</div>
      <div class="info-content">
        <span class="info-label">Date d'émission</span>
        <span class="info-value">{{ receipt.createdAt | date: "%d/%m/%Y" }}</span>
      </div>
    </div>
    <div class="info-card">
      <div class="info-icon" style="background: var(--primary-color)">💳</div>
      <div class="info-content">
        <span class="info-label">Mode de paiement</span>
        <span class="info-value">{{ order.paymentMethod | payment_method }}</span>
      </div>
    </div>
    <div class="info-card">
      <div class="info-icon" style="background: var(--primary-color)">✓</div>
      <div class="info-content">
        <span class="info-label">Statut</span>
        <span class="info-value status-paid">Payée</span>
      </div>
    </div>
  </div>

  <div class="parties-grid">
    <div class="party-card seller">
      <h3>Émetteur</h3>
      <p class="party-name">{{ restaurant.name }}</p>
      <p>{{ restaurant.address }}</p>
      <p>{{ restaurant.postalCode }} {{ restaurant.city }}</p>
      {% if restaurant.siret %}<p class="legal-info">SIRET: {{ restaurant.siret }}</p>{% endif %}
      {% if restaurant.vatNumber %}<p class="legal-info">TVA: {{ restaurant.vatNumber }}</p>{% endif %}
    </div>
    <div class="party-card buyer">
      <h3>Facturé à</h3>
      {% if customer %}
        <p class="party-name">{{ customer.name }}</p>
        {% if customer.address %}<p>{{ customer.address }}</p>{% endif %}
        {% if customer.email %}<p>{{ customer.email }}</p>{% endif %}
      {% else %}
        <p class="party-name">Client comptoir</p>
      {% endif %}
    </div>
  </div>

  <div class="items-section">
    <table class="items-table">
      <thead>
        <tr style="background: var(--primary-color)">
          <th>Description</th>
          <th class="center">Qté</th>
          <th class="right">Prix unit. HT</th>
          <th class="center">TVA</th>
          <th class="right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>
            <span class="item-name">{{ item.name }}</span>
            {% if item.modifiers.size > 0 %}
            <span class="item-mods">{% for mod in item.modifiers %}+ {{ mod.name }}{% unless forloop.last %}, {% endunless %}{% endfor %}</span>
            {% endif %}
          </td>
          <td class="center">{{ item.quantity }}</td>
          <td class="right">{{ item.unitPriceHT | money }}</td>
          <td class="center">10%</td>
          <td class="right">{{ item.totalHT | money }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>

  <div class="summary-section">
    <div class="summary-notes">
      {% if settings.footerText %}
      <h4>Notes</h4>
      <p>{{ settings.footerText }}</p>
      {% endif %}
    </div>
    <div class="summary-totals">
      <div class="summary-line"><span>Sous-total HT</span><span>{{ totals.subtotalHT | money }}</span></div>
      {% for tax in totals.taxes %}
      <div class="summary-line"><span>TVA {{ tax.rate }}%</span><span>{{ tax.amount | money }}</span></div>
      {% endfor %}
      {% if totals.discount > 0 %}
      <div class="summary-line discount"><span>Remise</span><span>-{{ totals.discount | money }}</span></div>
      {% endif %}
      <div class="summary-line total" style="background: var(--primary-color)">
        <span>Total TTC</span>
        <span>{{ totals.total | money }}</span>
      </div>
    </div>
  </div>

  <footer class="invoice-footer">
    <p class="legal-text">En cas de retard de paiement, une pénalité égale à 3 fois le taux d'intérêt légal sera exigible. Indemnité forfaitaire de recouvrement : 40€.</p>
    <p class="thank-you" style="color: var(--primary-color)">{{ settings.thankYouMessage | default: "Merci pour votre confiance !" }}</p>
  </footer>
</div>
`

const invoiceFullProCssStyles = `
.invoice.full-pro {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  max-width: 210mm;
  margin: 0 auto;
  background: white;
  color: #1f2937;
  position: relative;
}

.header-bar {
  height: 8px;
  width: 100%;
}

.invoice-header {
  padding: 30px 30px 20px;
}

.company-block {
  display: flex;
  align-items: center;
  gap: 20px;
}

.company-block .logo {
  max-width: 80px;
  max-height: 80px;
}

.company-details h1 {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.company-details p {
  margin: 3px 0;
  color: #6b7280;
}

.invoice-title {
  text-align: center;
  padding: 20px;
  background: #f9fafb;
}

.invoice-title h2 {
  font-size: 14px;
  letter-spacing: 3px;
  color: #9ca3af;
  margin: 0;
}

.invoice-number {
  font-size: 28px;
  font-weight: 700;
  margin-top: 5px;
}

.info-grid {
  display: flex;
  gap: 20px;
  padding: 25px 30px;
}

.info-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 10px;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.info-label {
  display: block;
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
}

.info-value {
  display: block;
  font-weight: 600;
  margin-top: 3px;
}

.status-paid {
  color: #059669;
}

.parties-grid {
  display: flex;
  gap: 30px;
  padding: 0 30px 25px;
}

.party-card {
  flex: 1;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.party-card h3 {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #9ca3af;
  margin: 0 0 15px 0;
}

.party-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px !important;
}

.party-card p {
  margin: 4px 0;
  color: #6b7280;
}

.legal-info {
  font-size: 11px;
  color: #9ca3af !important;
}

.items-section {
  padding: 0 30px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  color: white;
  padding: 14px 15px;
  text-align: left;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
}

.items-table th.center { text-align: center; }
.items-table th.right { text-align: right; }

.items-table td {
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
}

.items-table .center { text-align: center; }
.items-table .right { text-align: right; }

.item-name {
  display: block;
  font-weight: 500;
}

.item-mods {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 3px;
}

.summary-section {
  display: flex;
  gap: 30px;
  padding: 30px;
}

.summary-notes {
  flex: 1;
}

.summary-notes h4 {
  font-size: 11px;
  text-transform: uppercase;
  color: #9ca3af;
  margin: 0 0 10px 0;
}

.summary-notes p {
  color: #6b7280;
  font-size: 11px;
}

.summary-totals {
  width: 280px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  border-bottom: 1px solid #f3f4f6;
}

.summary-line.discount span:last-child {
  color: #dc2626;
}

.summary-line.total {
  color: white;
  font-weight: 700;
  font-size: 16px;
  border-radius: 8px;
  border: none;
  margin-top: 15px;
}

.invoice-footer {
  text-align: center;
  padding: 25px 30px;
  border-top: 1px solid #e5e7eb;
  margin: 0 30px;
}

.legal-text {
  font-size: 9px;
  color: #9ca3af;
  margin-bottom: 15px;
}

.thank-you {
  font-weight: 600;
  font-size: 14px;
}

@media print {
  .invoice.full-pro {
    max-width: 100%;
  }
}
`

async function seedReceiptTemplates() {
  console.log('Seeding receipt templates...')

  const templates = [
    {
      name: 'Classique',
      description: 'Template sobre et professionnel, adapté à tous les types de restaurants',
      type: ReceiptType.TICKET,
      htmlTemplate: classicHtmlTemplate,
      cssStyles: classicCssStyles,
      isSystem: true,
      isDefault: true,
    },
    {
      name: 'Moderne',
      description: 'Design moderne avec couleurs et mise en page élégante',
      type: ReceiptType.TICKET,
      htmlTemplate: modernHtmlTemplate,
      cssStyles: modernCssStyles,
      isSystem: true,
      isDefault: false,
    },
    {
      name: 'Minimaliste',
      description: 'Style épuré avec uniquement les informations essentielles',
      type: ReceiptType.TICKET,
      htmlTemplate: minimalHtmlTemplate,
      cssStyles: minimalCssStyles,
      isSystem: true,
      isDefault: false,
    },
    {
      name: 'Thermique 58mm',
      description: 'Optimisé pour les imprimantes thermiques 58mm',
      type: ReceiptType.TICKET,
      htmlTemplate: thermal58HtmlTemplate,
      thermalTemplate: thermal58HtmlTemplate,
      cssStyles: thermal58CssStyles,
      isSystem: true,
      isDefault: false,
    },
    {
      name: 'Thermique 80mm',
      description: 'Optimisé pour les imprimantes thermiques 80mm',
      type: ReceiptType.TICKET,
      htmlTemplate: thermal80HtmlTemplate,
      thermalTemplate: thermal80HtmlTemplate,
      cssStyles: thermal80CssStyles,
      isSystem: true,
      isDefault: false,
    },
    {
      name: 'Facture Simplifiée',
      description: 'Facture simplifiée pour les montants inférieurs à 150€',
      type: ReceiptType.INVOICE_SIMPLE,
      htmlTemplate: invoiceSimpleHtmlTemplate,
      cssStyles: invoiceSimpleCssStyles,
      isSystem: true,
      isDefault: true,
    },
    {
      name: 'Facture Simplifiée Moderne',
      description: 'Facture simplifiée avec design moderne',
      type: ReceiptType.INVOICE_SIMPLE,
      htmlTemplate: invoiceSimpleModernHtmlTemplate,
      cssStyles: invoiceSimpleModernCssStyles,
      isSystem: true,
      isDefault: false,
    },
    {
      name: 'Facture Complète',
      description: 'Facture complète avec toutes les mentions légales obligatoires',
      type: ReceiptType.INVOICE_FULL,
      htmlTemplate: invoiceFullHtmlTemplate,
      cssStyles: invoiceFullCssStyles,
      isSystem: true,
      isDefault: true,
    },
    {
      name: 'Facture Complète Pro',
      description: 'Facture professionnelle avec mise en page élégante',
      type: ReceiptType.INVOICE_FULL,
      htmlTemplate: invoiceFullProHtmlTemplate,
      cssStyles: invoiceFullProCssStyles,
      isSystem: true,
      isDefault: false,
    },
  ]

  for (const template of templates) {
    const existing = await prisma.receiptTemplate.findFirst({
      where: {
        name: template.name,
        isSystem: true,
        restaurantId: null,
      },
    })

    if (existing) {
      await prisma.receiptTemplate.update({
        where: { id: existing.id },
        data: template,
      })
      console.log(`  Updated template: ${template.name}`)
    } else {
      await prisma.receiptTemplate.create({
        data: template,
      })
      console.log(`  Created template: ${template.name}`)
    }
  }

  console.log('Receipt templates seeded successfully!')
}

seedReceiptTemplates()
  .catch((e) => {
    console.error('Error seeding receipt templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
