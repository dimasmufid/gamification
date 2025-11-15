"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Loader2 } from "lucide-react";
import { switchOrganization } from "@/lib/api/endpoints";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function OrganizationSwitcher() {
  const memberships = useAuthStore((state) => state.user?.memberships ?? []);
  const organization = useAuthStore((state) => state.organization);
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();
  const [isMutating, setIsMutating] = useState(false);

  if (!organization) {
    return null;
  }

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === organization.id) {
      return;
    }
    setIsMutating(true);
    try {
      const response = await switchOrganization(organizationId);
      setAuth(response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
      ]);
      toast.success("Workspace switched");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to switch organization";
      toast.error(message);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isMutating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span className="max-w-[160px] truncate text-left">
            {organization.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[280px]">
        <DropdownMenuLabel>Select workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organization.id}
            onSelect={(event) => {
              event.preventDefault();
              void handleSwitch(membership.organization.id);
            }}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {membership.organization.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {membership.organization.slug}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase">
                {membership.role}
              </Badge>
              {membership.organization.id === organization.id && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
