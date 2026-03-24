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

interface StaffInvitationEmailProps {
  firstName: string
  restaurantName: string
  role: string
  inviterName: string
  inviteLink: string
}

const roleLabels: Record<string, string> = {
  MANAGER: 'Gerant',
  STAFF: 'Employe',
  CASHIER: 'Caissier',
  KITCHEN: 'Cuisine',
}

export function StaffInvitationEmail({
  firstName,
  restaurantName,
  role,
  inviterName,
  inviteLink,
}: StaffInvitationEmailProps) {
  const roleLabel = roleLabels[role] || role

  return (
    <Html>
      <Head />
      <Preview>Vous etes invite a rejoindre {restaurantName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenue dans l'equipe !</Heading>
          <Text style={text}>
            Bonjour {firstName},
          </Text>
          <Text style={text}>
            <strong>{inviterName}</strong> vous invite a rejoindre l'equipe de <strong>{restaurantName}</strong> en tant que <strong>{roleLabel}</strong>.
          </Text>
          <Text style={text}>
            Cliquez sur le bouton ci-dessous pour configurer votre mot de passe et acceder a votre espace de travail.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Configurer mon compte
            </Button>
          </Section>
          <Text style={textSmall}>
            Ce lien est valable pendant 7 jours.
          </Text>
          <Text style={textSmall}>
            Si vous n'avez pas demande cette invitation, vous pouvez ignorer cet email.
          </Text>
          <Text style={footer}>
            L'equipe {restaurantName}
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

const textSmall = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '8px',
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
