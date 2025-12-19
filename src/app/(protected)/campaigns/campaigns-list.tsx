"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Eye,
  MousePointer,
  UserMinus,
  Clock,
  ChevronRight,
  BarChart3,
  Users,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  template_id: string | null;
  template?: { name: string } | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  unsubscribe_count: number;
  bounce_count: number;
  created_at: string;
  sent_at: string | null;
}

interface CampaignsListProps {
  campaigns: Campaign[];
  error?: string;
}

export function CampaignsList({ campaigns, error }: CampaignsListProps) {
  const router = useRouter();

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-lg border border-gray-200">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay campañas
        </h3>
        <p className="text-gray-500 mb-4">
          Crea tu primera campaña de email para empezar a hacer seguimiento.
        </p>
      </div>
    );
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-700";
      case "sending":
        return "bg-blue-100 text-blue-700";
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "scheduled":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "sent":
        return "Enviada";
      case "sending":
        return "Enviando";
      case "draft":
        return "Borrador";
      case "scheduled":
        return "Programada";
      default:
        return status;
    }
  }

  function calculateRate(count: number, total: number): string {
    if (total === 0) return "0%";
    return ((count / total) * 100).toFixed(1) + "%";
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          onClick={() => router.push(`/campaigns/${campaign.id}`)}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {campaign.name}
                </h3>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {getStatusLabel(campaign.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{campaign.subject}</p>
              {campaign.template?.name && (
                <p className="text-xs text-gray-400 mt-1">
                  Plantilla: {campaign.template.name}
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Recipients */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">Enviados</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {campaign.sent_count}
                <span className="text-sm font-normal text-gray-500">
                  /{campaign.total_recipients}
                </span>
              </p>
            </div>

            {/* Opens */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">Aperturas</span>
              </div>
              <p className="text-xl font-bold text-blue-700">
                {campaign.open_count}
              </p>
              <p className="text-xs text-blue-600">
                {calculateRate(campaign.open_count, campaign.sent_count)}
              </p>
            </div>

            {/* Clicks */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <MousePointer className="w-4 h-4" />
                <span className="text-xs font-medium">Clics</span>
              </div>
              <p className="text-xl font-bold text-green-700">
                {campaign.click_count}
              </p>
              <p className="text-xs text-green-600">
                {calculateRate(campaign.click_count, campaign.sent_count)}
              </p>
            </div>

            {/* Unsubscribes */}
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <UserMinus className="w-4 h-4" />
                <span className="text-xs font-medium">Bajas</span>
              </div>
              <p className="text-xl font-bold text-orange-700">
                {campaign.unsubscribe_count}
              </p>
              <p className="text-xs text-orange-600">
                {calculateRate(campaign.unsubscribe_count, campaign.sent_count)}
              </p>
            </div>

            {/* Date */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Fecha</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {campaign.sent_at
                  ? new Date(campaign.sent_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : new Date(campaign.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {campaign.status === "sent" && campaign.sent_count > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Engagement</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full"
                  style={{
                    width: `${Math.min(
                      (campaign.open_count / campaign.sent_count) * 100,
                      100
                    )}%`,
                  }}
                  title={`Aperturas: ${calculateRate(campaign.open_count, campaign.sent_count)}`}
                />
                <div
                  className="bg-green-500 h-full"
                  style={{
                    width: `${Math.min(
                      (campaign.click_count / campaign.sent_count) * 100,
                      100
                    )}%`,
                  }}
                  title={`Clics: ${calculateRate(campaign.click_count, campaign.sent_count)}`}
                />
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  Aperturas
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Clics
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
