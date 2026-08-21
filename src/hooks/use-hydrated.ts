"use client";

import { useEffect, useState } from "react";

// A form that submits through fetch cannot work before its island hydrates: the
// browser would send the form the plain way, to a page path that answers no
// write. Anything gated on this stays visibly disabled until it can act, which
// is the honest version of a click that does nothing.
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
