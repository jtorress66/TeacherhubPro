import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Users, TrendingUp, AlertCircle, Mail, Building, Phone, Search, RefreshCw } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const SCORE_COLORS = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200"
};

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-green-100 text-green-700",
  qualified: "bg-purple-100 text-purple-700",
  closed: "bg-slate-100 text-slate-500"
};

export default function LeadsDashboard() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterScore, setFilterScore] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/chatbot/leads`, { withCredentials: true }),
        axios.get(`${API}/api/chatbot/leads/stats`, { withCredentials: true })
      ]);
      setLeads(leadsRes.data.leads || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load leads:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = leads.filter(l => {
    const matchesSearch = !search || 
      `${l.first_name} ${l.last_name} ${l.email} ${l.school_org}`.toLowerCase().includes(search.toLowerCase());
    const matchesScore = filterScore === "all" || l.lead_score === filterScore;
    return matchesSearch && matchesScore;
  });

  return (
    <Layout>
      <div className="space-y-6" data-testid="leads-dashboard">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lead Dashboard</h1>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} data-testid="refresh-leads">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total Leads</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.high_priority}</p>
                  <p className="text-xs text-slate-500">High Priority</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.medium_priority}</p>
                  <p className="text-xs text-slate-500">Medium Priority</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><Mail className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.new_leads}</p>
                  <p className="text-xs text-slate-500">New / Unread</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or organization..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="leads-search"
            />
          </div>
          <div className="flex gap-2">
            {["all", "high", "medium", "low"].map(s => (
              <Button key={s} variant={filterScore === s ? "default" : "outline"} size="sm"
                onClick={() => setFilterScore(s)} data-testid={`filter-${s}`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Leads list */}
        <div className="space-y-3" data-testid="leads-list">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {leads.length === 0 ? "No leads captured yet. The chatbot will collect leads from your marketing pages." : "No leads match your search."}
            </div>
          ) : (
            filtered.map(lead => (
              <Card key={lead.lead_id} className="hover:shadow-md transition-shadow" data-testid={`lead-${lead.lead_id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <Badge variant="outline" className={SCORE_COLORS[lead.lead_score] || ""}>
                          {lead.lead_score}
                        </Badge>
                        <Badge variant="outline" className={STATUS_COLORS[lead.status] || ""}>
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.school_org && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{lead.school_org}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-400">
                        {lead.visitor_category && <span>Role: {lead.visitor_category}</span>}
                        {lead.interest_category && <span>Interest: {lead.interest_category}</span>}
                        {lead.page_url && <span>Page: {lead.page_url}</span>}
                      </div>
                      {lead.chat_summary && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Chat summary</summary>
                          <pre className="mt-1 text-xs text-slate-500 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 rounded p-2 max-h-32 overflow-y-auto">{lead.chat_summary}</pre>
                        </details>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 text-right flex-shrink-0">
                      {lead.created_at && new Date(lead.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
