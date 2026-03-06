import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  firstName: string
}

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

  return (
    <Html>
      <Head />
      <Preview>Bienvenue sur IziResto - Votre compte a ete cree</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>IziResto</Heading>
          <Heading style={heading}>Bienvenue sur IziResto !</Heading>
          <Text style={paragraph}>
            Bonjour {firstName},
          </Text>
          <Text style={paragraph}>
            Votre compte revendeur a ete cree avec succes. Vous pouvez maintenant commencer a creer des sites de commande en ligne pour vos clients restaurateurs.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={`${loginUrl}/login`}>
              Acceder a mon espace
            </Button>
          </Section>
          <Text style={paragraph}>
            Avec IziResto, vous pouvez :
          </Text>
          <Text style={listItem}>
            - Creer jusqu&apos;a 20 sites par licence
          </Text>
          <Text style={listItem}>
            - Gerer vos clients et leur facturation
          </Text>
          <Text style={listItem}>
            - Suivre les performances en temps reel
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            IziResto - La plateforme pour gerer vos restaurants
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f8f9fb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '16px',
  maxWidth: '560px',
}

const logo = {
  color: '#10b981',
  fontSize: '24px',
  fontWeight: '700',
  textAlign: 'center' as const,
  margin: '0 0 30px',
}

const heading = {
  color: '#1e2128',
  fontSize: '24px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}

const paragraph = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const listItem = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#10b981',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '22px',
  textAlign: 'center' as const,
}

export default WelcomeEmail
