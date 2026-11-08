import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text, Button } from "@react-email/components";
import type { TemplateEntry } from "./registry";

function TestEmail() {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Votre e-mail de test Mes garanties</Preview>
      <Body style={{ backgroundColor: "#ffffff", color: "#35363b", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "28px 24px", maxWidth: "560px", margin: "0 auto" }}>
          <Text style={{ color: "#b76536", fontWeight: "bold" }}>Mes garanties</Text>
          <Heading style={{ fontFamily: "Georgia, serif", fontWeight: "normal" }}>Votre e-mail de test</Heading>
          <Text style={{ fontSize: "15px", lineHeight: "1.6" }}>Bonjour, vous avez demandé cet exemple depuis la page Foyer de Mes garanties.</Text>
          <Text style={{ fontSize: "15px", lineHeight: "1.6" }}>Ce message confirme que vous pouvez recevoir nos e-mails à l’adresse de votre compte. Il s’agit d’un test : aucune garantie n’expire à cause de cet envoi et vos réglages d’alerte restent inchangés.</Text>
          <Button href="https://mesgaranties.com/foyer" style={{ backgroundColor: "#35363b", color: "#ffffff", borderRadius: "6px", padding: "12px 18px", fontSize: "14px" }}>Mon foyer</Button>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: TestEmail,
  subject: "Votre e-mail de test — Mes garanties",
  displayName: "E-mail de test",
  previewData: {},
} satisfies TemplateEntry;