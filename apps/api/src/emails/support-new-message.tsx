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

interface SupportNewMessageEmailProps {
  firstName: string
  ticketNumber: string
  subject: string
  senderName: string
  messagePreview: string
  ticketLink: string
  isFromAdmin: boolean
}

export function SupportNewMessageEmail({
  firstName,
  ticketNumber,
  subject,
  senderName,
  messagePreview,
  ticketLink,
  isFromAdmin,
}: SupportNewMessageEmailProps) {
  const previewText = `Nouvelle reponse sur le ticket ${ticketNumber}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Nouvelle reponse
          </Heading>
          
          <Text style={text}>
            Bonjour {firstName},
          </Text>
          
          <Text style={text}>
            {isFromAdmin 
              ? `L'equipe support IziResto a repondu a votre ticket.`
              : `${senderName} a ajoute une reponse au ticket.`
            }
          </Text>

          <Section style={ticketBox}>
            <Text style={ticketLabel}>Ticket</Text>
            <Text style={ticketValue}>{ticketNumber} - {subject}</Text>
            
            <Text style={ticketLabel}>Message</Text>
            <Text style={messageText}>
              "{messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview}"
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link style={button} href={ticketLink}>
              Voir la conversation
            </Link>
          </Section>

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

const messageText = {
  color: '#374151',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  marginBottom: '0',
  marginTop: '4px',
  lineHeight: '1.5',
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
