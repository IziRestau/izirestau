import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ResellerInvitationEmailProps {
  inviteLink: string
}

export function ResellerInvitationEmail({
  inviteLink,
}: ResellerInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Vous etes invite a rejoindre IziResto en tant que revendeur</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenue sur IziResto</Heading>
          <Text style={text}>
            Bonjour,
          </Text>
          <Text style={text}>
            Vous avez ete invite a rejoindre <strong>IziResto</strong> en tant que revendeur.
          </Text>
          <Text style={text}>
            Cliquez sur le bouton ci-dessous pour completer votre inscription et configurer votre compte revendeur.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Completer mon inscription
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
