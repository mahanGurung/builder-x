"use client"

import * as P from 'micro-packed';
import { createAddress, addressToString, AddressVersion, StacksWireType } from '@stacks/transactions';
import { hex } from '@scure/base';
import { type Hex, pad, toHex } from "viem";

// Circle xReserve bytes32 format for Stacks standard principals (official format):
//
// [0..10]  — 11 zero bytes (left padding)
// [11]     — version byte (0x1a = ST testnet, 0x16 = SP mainnet, etc.)
// [12..31] — hash160 (20 bytes)
//
// Total: 32 bytes
//
// Source: https://docs.stacks.co/more-guides/bridging-usdcx
//
// IMPORTANT: Only standard principals (ST.../SP...) are supported.
// Contract principals are NOT supported — only the base address can be used.
// For the Giver vault, use the operator's standard address:
//   ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

export const remoteRecipientCoder = P.wrap<string>({
  encodeStream(w, value: string) {
    // Strip contract suffix if present — only the standard address is encoded
    const addressPart = value.includes('.') ? value.split('.')[0] : value;
    const address = createAddress(addressPart);

    // Bytes 0–10: 11 zero bytes (left padding)
    P.bytes(11).encodeStream(w, new Uint8Array(11).fill(0));

    // Byte 11: version
    P.U8.encodeStream(w, address.version);

    // Bytes 12–31: hash160 (20 bytes)
    P.bytes(20).encodeStream(w, hex.decode(address.hash160));
  },

  decodeStream(r) {
    // Skip 11 left-padding bytes
    P.bytes(11).decodeStream(r);

    // Byte 11: version
    const version = P.U8.decodeStream(r);

    // Bytes 12–31: hash160
    const hash = P.bytes(20).decodeStream(r);

    return addressToString({
      hash160: hex.encode(hash),
      version: version as AddressVersion,
      type: StacksWireType.Address,
    });
  },
});

export function bytes32FromBytes(bytes: Uint8Array): Hex {
  return toHex(pad(bytes, { size: 32 }));
}
