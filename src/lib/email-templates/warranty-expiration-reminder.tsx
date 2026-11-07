import React from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface WarrantyLine {
  label?: string;
  endDate?: string;
  daysLeft?: number;
}

interface Props {
  memberName?: string;
  itemName?: string;
  itemUrl?: string;
  leadLabel?: string;
  warranties?: WarrantyLine[];
}

function remainingLabel(days: number | undefined) {
  if (days === 0) return "se termine aujourd’hui";
  if (days === 1) return "se termine demain";
  return `se termine dans ${days ?? "quelques"} jours`;
}

const Email = ({ memberName, itemName, itemUrl, leadLabel, warranties }: Props) => {
  const name = itemName || "Votre objet";
  const lines = warranties?.length ? warranties : [{ label: "Garantie", endDate: "Date à vérifier" }];
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Rappel de garantie pour {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Mes garanties</Text>
          <Heading style={heading}>Une échéance de garantie approche</Heading>
          <Text style={text}>Bonjour {memberName?.trim() || ""},</Text>
          <Text style={text}>
            Vous avez choisi d’être prévenu <strong>{leadLabel || "1 mois avant l’échéance"}</strong>.
            {" "}Voici le rappel pour <strong>{name}</strong>.
          </Text>
          <Section style={panel}>
            <Text style={itemNameStyle}>{name}</Text>
            {lines.map((warranty, index) => (
              <Text key={`${warranty.label}-${index}`} style={warrantyStyle}>
                <strong>{warranty.label || "Garantie"}</strong><br />
                {remainingLabel(warranty.daysLeft)}{warranty.endDate ? `, le ${warranty.endDate}` : ""}.
              </Text>
            ))}
          </Section>
          <Button style={button} href={itemUrl || "https://mesgaranties.com/calendrier"}>
            Voir l’objet et ses garanties
          </Button>
          <Hr style={divider} />
          <Text style={footer}>Vous pouvez modifier le délai de vos alertes dans la page Mon foyer.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data) => `Rappel garantie : ${typeof data["itemName"] === "string" ? data["itemName"] : "votre objet"}`,
  displayName: "Rappel d’expiration de garantie",
  previewData: {
    memberName: "Florent",
    itemName: "Machine à laver",
    itemUrl: "https://mesgaranties.com/calendrier",
    leadLabel: "1 mois avant l’échéance",
    warranties: [{ label: "Garantie légale", endDate: "15 janvier 2027", daysLeft: 31 }],
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif", color: "#35363b" };
const container = { margin: "0 auto", padding: "28px 24px", maxWidth: "560px" };
const brand = { color: "#b76536", fontSize: "14px", fontWeight: "bold", letterSpacing: "0.4px" };
const heading = { color: "#35363b", fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: "normal", lineHeight: "1.2" };
const text = { fontSize: "15px", lineHeight: "1.6" };
const panel = { backgroundColor: "#faf7f2", border: "1px solid #e5e0d9", borderRadius: "8px", padding: "18px", margin: "22px 0" };
const itemNameStyle = { color: "#35363b", fontFamily: "Georgia, serif", fontSize: "22px", margin: "0 0 12px" };
const warrantyStyle = { fontSize: "14px", lineHeight: "1.6", margin: "10px 0 0" };
const button = { backgroundColor: "#35363b", borderRadius: "6px", color: "#ffffff", display: "inline-block", fontSize: "14px", padding: "12px 18px", textDecoration: "none" };
const divider = { borderColor: "#e5e0d9", margin: "26px 0 18px" };
const footer = { color: "#74716c", fontSize: "12px", lineHeight: "1.5" };
