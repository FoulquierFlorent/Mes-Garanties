import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { SUPPORT_EMAIL } from "@/lib/support";

interface Props { name?: string; email?: string; category?: string; subject?: string; message?: string; requestId?: string }

function SupportRequest({ name, email, category, subject, message, requestId }: Props) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>{`Nouvelle demande : ${subject ?? ""}`}</Preview>
      <Body style={{ backgroundColor: "#ffffff", color: "#35363b", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "28px 24px", maxWidth: "560px", margin: "0 auto" }}>
          <Text style={{ color: "#b76536", fontWeight: "bold" }}>Mes garanties — Aide et assistance</Text>
          <Heading style={{ fontFamily: "Georgia, serif", fontWeight: "normal", fontSize: "22px" }}>{subject || "Nouvelle demande"}</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.6" }}>
            <strong>Catégorie :</strong> {category || "—"}<br />
            <strong>De :</strong> {name || "—"} ({email || "—"})<br />
            <strong>Référence :</strong> {requestId || "—"}
          </Text>
          <Hr />
          <Text style={{ fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{message || ""}</Text>
          <Hr />
          <Text style={{ fontSize: "12px", color: "#777" }}>Répondez directement à cet e-mail pour écrire au demandeur.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: SupportRequest,
  subject: (d: Record<string, any>) => `[${d["category"] ?? "Support"}] ${d["subject"] ?? "Nouvelle demande"}`,
  displayName: "Demande d'assistance",
  to: SUPPORT_EMAIL,
  previewData: { name: "Jeanne", email: "jeanne@example.com", category: "Assistance technique", subject: "Impossible d'ajouter un ticket", message: "Bonjour,\nle scan ne fonctionne pas.", requestId: "exemple" },
} satisfies TemplateEntry;
