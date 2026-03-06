import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface InvitationEmailProps {
  firstName: string
  resellerName: string
  inviteLink: string
}

export function InvitationEmail({
  firstName,
  resellerName,
  inviteLink,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Vous etes invite a rejoindre IziResto</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenue sur IziResto</Heading>
          <Text style={text}>
            Bonjour {firstName},
          </Text>
          <Text style={text}>
            <strong>{resellerName}</strong> vous invite a creer votre compte restaurant sur IziResto.
          </Text>
          <Text style={text}>
            Cliquez sur le bouton ci-dessous pour configurer votre restaurant et commencer a recevoir des commandes en ligne.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Creer mon restaurant
            </Button>
          </Section>
          <Text style={text}>
            Ce lien est valable pendant 7 jours.
          </Text>
          <Text style={text}>
            Si vous n'avez pas demande cette invitation, vous pouvez ignorer cet email.
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
