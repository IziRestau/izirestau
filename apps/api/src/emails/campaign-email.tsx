import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface CampaignEmailProps {
  content: string
  restaurantName: string
  firstName?: string
  lastName?: string
  loyaltyPoints?: number
  unsubscribeUrl?: string
  trackingPixelUrl?: string
}

export function CampaignEmail({
  content,
  restaurantName,
  firstName = '',
  lastName = '',
  loyaltyPoints = 0,
  unsubscribeUrl,
  trackingPixelUrl,
}: CampaignEmailProps) {
  // Remplacer les variables dans le contenu
  const processedContent = content
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{lastName\}\}/g, lastName)
    .replace(/\{\{loyaltyPoints\}\}/g, String(loyaltyPoints))
    .replace(/\{\{restaurantName\}\}/g, restaurantName)

  return (
    <Html>
      <Head />
      <Preview>{restaurantName} - Nouvelle communication</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentSection}>
            {processedContent.split('\n').map((line, index) => (
              <Text key={index} style={paragraph}>
                {line || '\u00A0'}
              </Text>
            ))}
          </Section>

          {unsubscribeUrl && (
            <Section style={footer}>
              <Text style={footerText}>
                Vous recevez cet email car vous avez accepté de recevoir des communications de {restaurantName}.
              </Text>
              <Text style={footerText}>
                <a href={unsubscribeUrl} style={unsubscribeLink}>
                  Se désabonner
                </a>
              </Text>
            </Section>
          )}

          {trackingPixelUrl && (
            <Img src={trackingPixelUrl} width="1" height="1" alt="" style={{ display: 'none' }} />
          )}
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
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const contentSection = {
  padding: '0 48px',
}

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '0 0 10px',
}

const footer = {
  padding: '32px 48px 0',
  borderTop: '1px solid #e6ebf1',
  marginTop: '32px',
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
}

export default CampaignEmail
