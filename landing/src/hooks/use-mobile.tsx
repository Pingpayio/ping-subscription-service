
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Set initial value
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check immediately
    checkMobile()
    
    // Use matchMedia and resize event for better coverage
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobile)
    window.addEventListener("resize", checkMobile)
    
    return () => {
      mql.removeEventListener("change", checkMobile)
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return isMobile === undefined ? false : isMobile
}
