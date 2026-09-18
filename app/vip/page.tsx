import { permanentRedirect } from "next/navigation";

// La vecchia soglia "LoreWise VIP" è confluita nella pagina unica del Universe Pass.
// Il reindirizzamento permanente (308) conserva i link esterni già condivisi.
export default function VipGatewayRedirect() {
  permanentRedirect("/abbonamento");
}
