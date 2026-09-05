import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/server/session-cookie";
import { SiteNav } from "./site-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <Image
          src="/assets/esports-mostviertel-logo.webp"
          alt="Logo von eSports Mostviertel"
          width={48}
          height={48}
        />
        <span>eSports Mostviertel</span>
      </Link>
      <SiteNav
        viewer={
          user
            ? { isMainAdmin: user.isMainAdmin, isApproved: user.isApproved }
            : null
        }
      />
    </header>
  );
}
