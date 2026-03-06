import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Button,
  Img,
} from '@react-email/components'

interface ReceiptItem {
  name: string
  quantity: number
  total: number
}

interface ReceiptEmailProps {
  customerName: string
  restaurantName: string
  restaurantLogo?: string
  restaurantAddress?: string
  restaurantPhone?: string
  restaurantEmail?: string
  primaryColor?: string
  receiptNumber: string
  orderNumber: string
  date: string
  items: ReceiptItem[]
  subtotal: number
  taxAmount: number
  discount?: number
  deliveryFee?: number
  total: number
  receiptType: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'
  viewReceiptUrl?: string
  thankYouMessage?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const getReceiptTypeLabel = (type: string) => {
  switch (type) {
    case 'INVOICE_FULL':
      return 'Facture'
    case 'INVOICE_SIMPLE':
      return 'Facture simplifiée'
    default:
      return 'Ticket de caisse'
  }
}

export function ReceiptEmail({
  customerName,
  restaurantName,
  restaurantLogo,
  restaurantAddress,
  restaurantPhone,
  restaurantEmail,
  primaryColor = '#10b981',
  receiptNumber,
  orderNumber,
  date,
  items,
  subtotal,
  taxAmount,
  discount = 0,
  deliveryFee = 0,
  total,
  receiptType,
  viewReceiptUrl,
  thankYouMessage,
}: ReceiptEmailProps) {
  const receiptTypeLabel = getReceiptTypeLabel(receiptType)

  return (
    <Html>
      <Head />
      <Preview>
        {receiptTypeLabel} {receiptNumber} - {restaurantName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header avec logo restaurant */}
          <Section style={headerSection}>
            {restaurantLogo && (
              <Img
                src={restaurantLogo}
                width="120"
                height="60"
                alt={restaurantName}
                style={logo}
              />
            )}
            <Text style={{ ...restaurantTitle, color: primaryColor }}>
              {restaurantName}
            </Text>
          </Section>

          <Heading style={h1}>
            Votre {receiptTypeLabel.toLowerCase()}
          </Heading>
          
          <Text style={text}>
            Bonjour {customerName},
          </Text>
          
          <Text style={text}>
            Merci pour votre commande. Vous trouverez ci-dessous le récapitulatif de votre achat.
          </Text>

          {/* Infos du reçu */}
          <Section style={receiptBox}>
            <table style={infoTable}>
              <tbody>
                <tr>
                  <td style={infoLabel}>N° {receiptTypeLabel}</td>
                  <td style={infoValue}>{receiptNumber}</td>
                </tr>
                <tr>
                  <td style={infoLabel}>N° Commande</td>
                  <td style={infoValue}>{orderNumber}</td>
                </tr>
                <tr>
                  <td style={infoLabel}>Date</td>
                  <td style={infoValue}>{date}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Articles */}
          <Section style={itemsSection}>
            <Text style={sectionTitle}>Détail de la commande</Text>
            
            <table style={itemsTable}>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td style={itemName}>{item.quantity}x {item.name}</td>
                    <td style={itemPrice}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <Hr style={divider} />
            
            {/* Totaux */}
            <table style={totalsTable}>
              <tbody>
                <tr>
                  <td style={totalLabel}>Sous-total HT</td>
                  <td style={totalValue}>{formatCurrency(subtotal - taxAmount)}</td>
                </tr>
                <tr>
                  <td style={totalLabel}>TVA</td>
                  <td style={totalValue}>{formatCurrency(taxAmount)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={totalLabel}>Remise</td>
                    <td style={{ ...totalValue, color: '#059669' }}>-{formatCurrency(discount)}</td>
                  </tr>
                )}
                {deliveryFee > 0 && (
                  <tr>
                    <td style={totalLabel}>Frais de livraison</td>
                    <td style={totalValue}>{formatCurrency(deliveryFee)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <Hr style={divider} />
            
            <table style={totalsTable}>
              <tbody>
                <tr>
                  <td style={grandTotalLabel}>Total TTC</td>
                  <td style={{ ...grandTotalValue, color: primaryColor }}>{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Bouton voir le reçu */}
          {viewReceiptUrl && (
            <Section style={buttonSection}>
              <Button
                style={{ ...button, backgroundColor: primaryColor }}
                href={viewReceiptUrl}
              >
                Voir le {receiptTypeLabel.toLowerCase()} complet
              </Button>
            </Section>
          )}

          {/* Message de remerciement */}
          {thankYouMessage && (
            <Text style={thankYouText}>
              {thankYouMessage}
            </Text>
          )}

          {/* Footer restaurant */}
          <Hr style={footerDivider} />
          
          <Section style={footerSection}>
            <Text style={footerRestaurant}>{restaurantName}</Text>
            {restaurantAddress && (
              <Text style={footerText}>{restaurantAddress}</Text>
            )}
            {restaurantPhone && (
              <Text style={footerText}>Tél : {restaurantPhone}</Text>
            )}
            {restaurantEmail && (
              <Text style={footerText}>{restaurantEmail}</Text>
            )}
          </Section>

          <Text style={footerLegal}>
            Ce document tient lieu de {receiptTypeLabel.toLowerCase()}.
            Conservez-le pour vos archives.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  borderRadius: '12px',
  maxWidth: '600px',
}

const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const logo = {
  margin: '0 auto',
  objectFit: 'contain' as const,
}

const restaurantTitle = {
  fontSize: '18px',
  fontWeight: '700',
  marginTop: '12px',
  marginBottom: '0',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
}

const receiptBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '24px',
  marginBottom: '24px',
}

const infoTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const infoLabel = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '8px 0',
  textAlign: 'left' as const,
}

const infoValue = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 0',
  textAlign: 'right' as const,
}

const itemsSection = {
  marginBottom: '24px',
}

const sectionTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '16px',
}

const itemsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const itemName = {
  color: '#374151',
  fontSize: '14px',
  padding: '8px 0',
  textAlign: 'left' as const,
}

const itemPrice = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500',
  padding: '8px 0',
  textAlign: 'right' as const,
}

const divider = {
  borderColor: '#e5e7eb',
  marginTop: '16px',
  marginBottom: '16px',
}

const totalsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const totalLabel = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '6px 0',
  textAlign: 'left' as const,
}

const totalValue = {
  color: '#374151',
  fontSize: '14px',
  padding: '6px 0',
  textAlign: 'right' as const,
}

const grandTotalLabel = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  padding: '8px 0',
  textAlign: 'left' as const,
}

const grandTotalValue = {
  fontSize: '20px',
  fontWeight: '700',
  padding: '8px 0',
  textAlign: 'right' as const,
}

const buttonSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
}

const button = {
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const thankYouText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
  marginTop: '16px',
  marginBottom: '24px',
}

const footerDivider = {
  borderColor: '#e5e7eb',
  marginTop: '32px',
  marginBottom: '24px',
}

const footerSection = {
  textAlign: 'center' as const,
}

const footerRestaurant = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '4px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  marginTop: '0',
  marginBottom: '4px',
}

const footerLegal = {
  color: '#9ca3af',
  fontSize: '11px',
  textAlign: 'center' as const,
  marginTop: '24px',
}
