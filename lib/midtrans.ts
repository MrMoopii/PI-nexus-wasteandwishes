import "server-only";
import midtransClient from "midtrans-client";

function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProductionText = process.env.MIDTRANS_IS_PRODUCTION?.trim();

  if (!serverKey || !clientKey) {
    throw new Error("MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY harus diisi.");
  }

  if (isProductionText !== "true" && isProductionText !== "false") {
    throw new Error("MIDTRANS_IS_PRODUCTION harus bernilai true atau false.");
  }

  return { serverKey, clientKey, isProduction: isProductionText === "true" };
}

export function getMidtransSnap(): InstanceType<typeof midtransClient.Snap> {
  return new midtransClient.Snap(getMidtransConfig());
}
