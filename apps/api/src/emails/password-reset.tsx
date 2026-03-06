import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PasswordResetEmailProps {
  firstName: string
  resetLink: string
}

export function PasswordResetEmail({ firstName, resetLink }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reinitialisation de votre mot de passe IziResto</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>IziResto</Heading>
          <Heading style={heading}>Reinitialisation de mot de passe</Heading>
          <Text style={paragraph}>
            Bonjour {firstName},
          </Text>
          <Text style={paragraph}>
            Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Reinitialiser mon mot de passe
            </Button>
          </Section>
          <Text style={paragraph}>
            Ce lien expirera dans 1 heure. Si vous n&apos;avez pas demande cette reinitialisation, vous pouvez ignorer cet email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
          </Text>
          <Link href={resetLink} style={link}>
            {resetLink}
          </Link>
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
  margin: '8px 0',
}

const link = {
  color: '#10b981',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

export default PasswordResetEmail
