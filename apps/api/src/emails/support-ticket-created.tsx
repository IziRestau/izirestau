import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SupportTicketCreatedEmailProps {
  firstName: string
  ticketNumber: string
  subject: string
  category: string
  ticketLink: string
  isAdmin?: boolean
  organizationName?: string
}

const categoryLabels: Record<string, string> = {
  BILLING: 'Facturation',
  TECHNICAL: 'Technique',
  FEATURE_REQUEST: 'Suggestion',
  ACCOUNT: 'Compte',
  OTHER: 'Autre',
}

export function SupportTicketCreatedEmail({
  firstName,
  ticketNumber,
  subject,
  category,
  ticketLink,
  isAdmin = false,
  organizationName,
}: SupportTicketCreatedEmailProps) {
  const previewText = isAdmin 
    ? `Nouveau ticket support: ${ticketNumber}`
    : `Votre ticket ${ticketNumber} a ete cree`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isAdmin ? 'Nouveau ticket support' : 'Ticket cree avec succes'}
          </Heading>
          
          <Text style={text}>
            Bonjour {firstName},
          </Text>
          
          {isAdmin ? (
            <Text style={text}>
              Un nouveau ticket de support a ete cree par <strong>{organizationName}</strong>.
            </Text>
          ) : (
            <Text style={text}>
              Votre demande de support a bien ete enregistree. Notre equipe va l'examiner et vous repondre dans les plus brefs delais.
            </Text>
          )}

          <Section style={ticketBox}>
            <Text style={ticketLabel}>Numero du ticket</Text>
            <Text style={ticketValue}>{ticketNumber}</Text>
            
            <Text style={ticketLabel}>Sujet</Text>
            <Text style={ticketValue}>{subject}</Text>
            
            <Text style={ticketLabel}>Categorie</Text>
            <Text style={ticketValue}>{categoryLabels[category] || category}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Link style={button} href={ticketLink}>
              Voir le ticket
            </Link>
          </Section>

          <Text style={text}>
            {isAdmin 
              ? 'Connectez-vous au dashboard pour repondre a ce ticket.'
              : 'Vous recevrez une notification par email lorsque nous repondrons a votre demande.'
            }
          </Text>

          <Text style={footer}>
            L'equipe IziResto
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

const ticketBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '24px',
  marginBottom: '24px',
}

const ticketLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  marginBottom: '4px',
  marginTop: '12px',
}

const ticketValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '500',
  marginBottom: '0',
  marginTop: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  marginTop: '32px',
}
