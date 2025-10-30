import { useState } from "react";
import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function useExternalLink() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  const openExternal = (url: string) => {
    setPendingLink(url);
    setConfirmOpen(true);
  };

  const proceedOpen = () => {
    if (pendingLink) {
      window.open(pendingLink, "_blank", "noopener,noreferrer");
    }
    setConfirmOpen(false);
    setPendingLink(null);
  };

  const cancelOpen = () => {
    setConfirmOpen(false);
    setPendingLink(null);
  };

  const ExternalLinkDialog = (): ReactElement => {
    return (
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opening link in a new tab</DialogTitle>
            <DialogDescription>
              You are about to open this link in a new tab:
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-md break-all text-sm">{pendingLink}</div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelOpen} data-testid="button-external-link-cancel">Cancel</Button>
            <Button onClick={proceedOpen} data-testid="button-external-link-proceed">Open Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return { openExternal, ExternalLinkDialog };
}
