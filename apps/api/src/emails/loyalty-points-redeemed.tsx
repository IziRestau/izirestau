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

interface LoyaltyPointsRedeemedEmailProps {
  customerName: string
  restaurantName: string
  restaurantLogo?: string
  primaryColor?: string
  pointsUsed: number
  discountAmount: string
  remainingPoints: number
  orderNumber: string
  accountUrl?: string
}

export function LoyaltyPointsRedeemedEmail({
  customerName,
  restaurantName,
  restaurantLogo,
  primaryColor = '#10b981',
  pointsUsed,
  discountAmount,
  remainingPoints,
  orderNumber,
  accountUrl,
}: LoyaltyPointsRedeemedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Vous avez utilisé ${pointsUsed} points chez ${restaurantName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {restaurantLogo && (
            <Section style={logoSection}>
              <Img src={restaurantLogo} alt={restaurantName} style={logo} />
            </Section>
          )}

          <Heading style={{ ...heading, color: primaryColor }}>
            Points utilisés !
          </Heading>

          <Text style={paragraph}>
            Bonjour {customerName},
          </Text>

          <Text style={paragraph}>
            Vous avez utilisé vos points de fidélité pour votre commande chez <strong>{restaurantName}</strong>.
          </Text>

          <Section style={{ ...pointsBox, borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
            <Text style={{ ...pointsLabel, color: primaryColor }}>Réduction appliquée</Text>
            <Text style={{ ...pointsValue, color: primaryColor }}>-{discountAmount}</Text>
            <Text style={{ ...pointsSubtext, color: primaryColor }}>
              ({pointsUsed.toLocaleString('fr-FR')} points utilisés)
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={detailRow}>
              <span style={detailLabel}>Commande</span>
              <span style={detailValue}>#{orderNumber}</span>
            </Text>
            <Hr style={divider} />
            <Text style={detailRow}>
              <span style={detailLabel}>Solde restant</span>
              <span style={{ ...detailValue, fontWeight: 'bold', color: primaryColor }}>
                {remainingPoints.toLocaleString('fr-FR')} points
              </span>
            </Text>
          </Section>

          <Text style={paragraph}>
            Continuez à commander pour accumuler de nouveaux points !
          </Text>

          {accountUrl && (
            <Section style={buttonSection}>
              <Button style={{ ...button, backgroundColor: primaryColor }} href={accountUrl}>
                Voir mon compte fidélité
              </Button>
            </Section>
          )}

          <Hr style={divider} />

          <Text style={footer}>
            Cet email vous a été envoyé par {restaurantName}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
  borderRadius: '8px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const logo = {
  maxHeight: '60px',
  maxWidth: '200px',
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const paragraph = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#525f7f',
  margin: '0 0 16px',
}

const pointsBox = {
  textAlign: 'center' as const,
  padding: '24px',
  borderRadius: '12px',
  border: '2px solid',
  margin: '24px 0',
}

const pointsLabel = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const pointsValue = {
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1',
}

const pointsSubtext = {
  fontSize: '12px',
  margin: '8px 0 0',
  opacity: 0.8,
}

const detailsBox = {
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '8px',
  margin: '24px 0',
}

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '14px',
  margin: '8px 0',
  color: '#525f7f',
}

const detailLabel = {
  color: '#8898aa',
}

const detailValue = {
  color: '#32325d',
}

const divider = {
  borderColor: '#e6ebf1',
  margin: '16px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  borderRadius: '8px',
}

const footer = {
  fontSize: '12px',
  color: '#8898aa',
  textAlign: 'center' as const,
  margin: '0',
}

export default LoyaltyPointsRedeemedEmail
