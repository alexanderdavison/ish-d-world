import type { Metadata } from "next";
import { AccessTerminal } from "@/components/access-terminal";
import { StationPage } from "@/components/station-page";
import { TransmissionList } from "@/components/transmission-list";

export const metadata: Metadata = { title: "Unrouted Node" };

export default function UnroutedPage() {
  return (
    <StationPage code="X0" eyebrow="RESTRICTED TRANSMISSION" title="Unrouted Node" kind="media">
      <AccessTerminal />
      <TransmissionList scope="WEB EXCLUSIVE" />
    </StationPage>
  );
}
