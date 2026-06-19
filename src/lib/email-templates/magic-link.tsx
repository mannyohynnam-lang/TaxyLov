import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  siteName: string
  token: string
}

export const MagicLinkEmail = ({
  siteName,
  token,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login code for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your login code</Heading>
        <Text style={text}>
          Enter the code below to log in to {siteName}. This code will expire
          shortly.
        </Text>
        <Text style={code}>{token}</Text>
        <Text style={footer}>
          If you didn't request this code, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const code = {
  fontSize: '32px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  color: '#000000',
  textAlign: 'center' as const,
  margin: '20px 0',
  fontFamily: 'monospace',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
