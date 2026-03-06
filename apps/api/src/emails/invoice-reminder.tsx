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
} from '@react-email/components'

interface InvoiceReminderEmailProps {
  clientName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  organizationName: string
  isOverdue?: boolean
}

export function InvoiceReminderEmail({
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  organizationName,
  isOverdue = false,
}: InvoiceReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {isOverdue 
          ? `Facture ${invoiceNumber} en retard de paiement`
          : `Rappel : Facture ${invoiceNumber} a regler`
        }
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isOverdue ? 'Facture en retard' : 'Rappel de paiement'}
          </Heading>
          
          <Text style={text}>
            Bonjour {clientName},
          </Text>
          
          <Text style={text}>
            {isOverdue 
              ? `Nous vous rappelons que la facture ${invoiceNumber} est en retard de paiement.`
              : `Nous vous rappelons que la facture ${invoiceNumber} arrive bientot a echeance.`
            }
          </Text>

          <Section style={invoiceBox}>
            <Text style={invoiceLabel}>Numero de facture</Text>
            <Text style={invoiceValue}>{invoiceNumber}</Text>
            
            <Hr style={divider} />
            
            <Text style={invoiceLabel}>Montant a regler</Text>
            <Text style={invoiceAmount}>{amount}</Text>
            
            <Hr style={divider} />
            
            <Text style={invoiceLabel}>Date d'echeance</Text>
            <Text style={invoiceValue}>{dueDate}</Text>
          </Section>

          <Text style={text}>
            Nous vous invitons a proceder au reglement dans les meilleurs delais.
          </Text>

          <Text style={text}>
            Si vous avez deja effectue le paiement, veuillez ignorer ce message.
          </Text>

          <Text style={text}>
            Pour toute question concernant cette facture, n'hesitez pas a nous contacter.
          </Text>

          <Text style={footer}>
            Cordialement,<br />
            L'equipe {organizationName}
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

const invoiceBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
}

const invoiceLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '4px',
}

const invoiceValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '500',
  marginTop: '0',
  marginBottom: '0',
}

const invoiceAmount = {
  color: '#059669',
  fontSize: '24px',
  fontWeight: '700',
  marginTop: '0',
  marginBottom: '0',
}

const divider = {
  borderColor: '#e5e7eb',
  marginTop: '16px',
  marginBottom: '16px',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  marginTop: '32px',
}
