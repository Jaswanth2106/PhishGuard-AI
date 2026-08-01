"use client"

import { useState } from "react"
import { Bell, Key, Shield, Trash2, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const handleSave = () => {
    setSaving(true)
    setMessage("")
    // Mock save operation
    setTimeout(() => {
      setSaving(false)
      setMessage("Settings saved successfully.")
      setTimeout(() => setMessage(""), 3000)
    }, 1000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground mt-2">Manage your account preferences, API keys, and notification settings.</p>
      </div>

      <div className="glass-card rounded-xl border border-border/50 overflow-hidden divide-y divide-border/50">
        
        {/* API Keys */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg">API Keys</h3>
              <p className="text-sm text-muted-foreground">Manage your secret keys for accessing the PhishGuard API programmatically.</p>
              
              <div className="mt-4 p-4 bg-muted/30 border border-border/50 rounded-lg flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Production Key</p>
                  <p className="text-xs text-muted-foreground font-mono">pk_live_**********************</p>
                </div>
                <Button variant="outline" size="sm">Regenerate</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Notifications</h3>
                <p className="text-sm text-muted-foreground">Control how and when you receive alerts from PhishGuard.</p>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Weekly Threat Reports</p>
                    <p className="text-xs text-muted-foreground">Receive a summary of scanned emails and threat trends.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                </label>

                <label className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Critical Alerts</p>
                    <p className="text-xs text-muted-foreground">Immediate email if a high-confidence phishing attempt is detected.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Security Settings</h3>
                <p className="text-sm text-muted-foreground">Manage automatic scanning rules and privacy options.</p>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Auto-Scan Incoming</p>
                    <p className="text-xs text-muted-foreground">Automatically scan emails forwarded to your PhishGuard inbox address.</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                </label>

                <label className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Data Privacy</p>
                    <p className="text-xs text-muted-foreground">Allow anonymized metadata to be used to improve the ML model.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 bg-destructive/5 border-t-destructive/20">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Irreversible actions regarding your account and data.</p>
              
              <div className="mt-4">
                <Button variant="destructive" size="sm">
                  Delete Account & All Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving} className="min-w-24">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving" : "Save Changes"}
        </Button>
        {message && <p className="text-sm text-emerald-500 font-medium animate-in slide-in-from-left-2">{message}</p>}
      </div>
    </div>
  )
}