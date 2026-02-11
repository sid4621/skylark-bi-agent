const MONDAY_API_URL = "https://api.monday.com/v2";

// Board IDs from Environment
const getBoardIds = () => {
  const dealsId = process.env.DEALS_BOARD_ID;
  const workOrdersId = process.env.WORK_ORDERS_BOARD_ID;

  if (!dealsId || !workOrdersId) {
    throw new Error("Missing DEALS_BOARD_ID or WORK_ORDERS_BOARD_ID in environment variables");
  }

  return {
    DEALS: parseInt(dealsId),
    WORK_ORDERS: parseInt(workOrdersId)
  };
};

// Types for cleaned data
export interface Deal {
  id: string;
  name: string;
  stage: string;
  sector: string;
  deal_value: number;
  probability: number;
  close_date: string; // ISO format
  owner: string;
}

export interface WorkOrder {
  id: string;
  name: string;
  status: string;
  energy_type: string;
  start_date: string;
  end_date: string;
}

export interface DataQualityReport {
  missingDealValueCount: number;
  missingSectorCount: number;
  missingCloseDateCount: number;
  missingWorkOrderStatusCount: number;
}

export interface KPIS {
  totalPipelineValue: number;
  expectedRevenueWeighted: number;
  dealsCount: number;
  openDealsCount: number;
  pipelineBySector: Record<string, number>;
  totalWorkOrders: number;
  completedWorkOrders: number;
  delayedWorkOrders: number; // Simplified logic for demo
  executionStatusBreakdown: Record<string, number>;
}

export interface AgentData {
  deals: Deal[];
  workOrders: WorkOrder[];
  kpis: KPIS;
  dataQuality: DataQualityReport;
}

// Helper to normalize text
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.trim(); // Keep case for display usually, or title case if needed? standardizing on trim for now.
};

// Helper to parse numbers safely
const parseNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]+/g, ""); // Remove currency symbols etc
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Helper to normalized dates
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  return dateStr; // Monday dates are usually ISO YYYY-MM-DD
};

// Fetch data from Monday.com
export async function fetchMondayData(): Promise<AgentData> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    throw new Error("MONDAY_API_KEY is missing in environment variables.");
  }

  const BOARD_IDS = getBoardIds();

  // Unified Query fetching columns AND items in one go
  const query = `query {
  deals: boards(ids: [${BOARD_IDS.DEALS}]) {
        columns { id title }
    items_page(limit: 500) { items { id name column_values { id text } } }
  }
  work_orders: boards(ids: [${BOARD_IDS.WORK_ORDERS}]) {
        columns { id title }
    items_page(limit: 500) { items { id name column_values { id text } } }
  }
} `;
  try {
    const response = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Monday API Failed: ${response.status} ${response.statusText} - ${errorText} `);
    }
    const json = await response.json();
    if (json.errors) {
      throw new Error(`Monday GraphQL Error: ${JSON.stringify(json.errors)} `);
    }
    const dealBoard = json.data.deals?.[0];
    const woBoard = json.data.work_orders?.[0];

    if (!dealBoard || !woBoard) {
      throw new Error("Could not find boards. Check IDs.");
    }

    const rawDeals = dealBoard.items_page?.items || [];
    const rawWorkOrders = woBoard.items_page?.items || [];

    // Map column titles to IDs for robust fetching
    const dealColMap = new Map<string, string>(dealBoard.columns.map((c: any) => [c.title.toLowerCase(), c.id]));
    const woColMap = new Map<string, string>(woBoard.columns.map((c: any) => [c.title.toLowerCase(), c.id]));

    // --- Helper to get value by title ---
    const getValue = (item: any, map: Map<string, string>, titleKeywords: string[]): string => {
      const matchedEntry = Array.from(map.entries()).find(([title]) => titleKeywords.some(k => title.includes(k)));
      const matchedId = matchedEntry?.[1];

      if (!matchedId) return "";
      // Note: item.column_values is an array of {id, text}
      const col = item.column_values.find((cv: any) => cv.id === matchedId);
      return col ? col.text : "";
    };

    // --- Process Deals ---
    const deals: Deal[] = [];
    const quality: DataQualityReport = {
      missingDealValueCount: 0,
      missingSectorCount: 0,
      missingCloseDateCount: 0,
      missingWorkOrderStatusCount: 0,
    };

    rawDeals.forEach((item: any, idx: number) => {
      const dealValueStr = getValue(item, dealColMap, ["value", "amount", "budget", "price"]);
      const stage = getValue(item, dealColMap, ["stage", "status"]);
      const sector = getValue(item, dealColMap, ["sector", "industry", "vertical"]);
      const probStr = getValue(item, dealColMap, ["probability", "confidence", "%"]);

      const closeDate = getValue(item, dealColMap, ["close", "date", "timeline"]);
      const owner = getValue(item, dealColMap, ["owner", "person"]);

      const deal_value = parseNumber(dealValueStr);

      // Parse Probability (Handle "High"/"Medium"/"Low" text)
      let probability = 0;
      const pLower = probStr.toLowerCase();
      if (pLower.includes("high")) probability = 90;
      else if (pLower.includes("medium")) probability = 50;
      else if (pLower.includes("low")) probability = 20;
      else {
        probability = parseNumber(probStr.replace("%", ""));
      }

      if (!deal_value) quality.missingDealValueCount++;
      if (!sector) quality.missingSectorCount++;
      if (!closeDate) quality.missingCloseDateCount++;

      deals.push({
        id: item.id,
        name: item.name,
        stage,
        sector: normalizeText(sector) || "Unassigned",
        deal_value,
        probability,
        close_date: normalizeDate(closeDate),
        owner: normalizeText(owner)
      });
    });

    // --- Process Work Orders ---
    const workOrders: WorkOrder[] = [];
    rawWorkOrders.forEach((item: any) => {
      // Updated mappings based on User's Column List
      // Status -> "Execution Status" or "WO Status (billed)"
      const status = getValue(item, woColMap, ["execution status", "wo status", "invoice status"]);

      // Energy Type -> "Nature of Work" or "Type of Work"
      const energy = getValue(item, woColMap, ["nature of work", "type of work"]);

      // Start -> "Probable Start Date"
      const start = getValue(item, woColMap, ["probable start", "start date"]);

      // End -> "Probable End Date" or "Data Delivery Date"
      const end = getValue(item, woColMap, ["probable end", "end date", "delivery date"]);

      if (!status) quality.missingWorkOrderStatusCount++;

      workOrders.push({
        id: item.id,
        name: item.name,
        status: normalizeText(status) || "Pending",
        energy_type: normalizeText(energy),
        start_date: normalizeDate(start),
        end_date: normalizeDate(end)
      });
    });

    // --- Calculate KPIs ---
    const totalPipelineValue = deals.reduce((sum, d) => sum + d.deal_value, 0);
    const expectedRevenueWeighted = deals.reduce((sum, d) => sum + (d.deal_value * (d.probability / 100)), 0);
    const openDealsCount = deals.filter(d => !["won", "lost", "done", "closed", "fullfilled"].includes(d.stage.toLowerCase())).length;

    const pipelineBySector: Record<string, number> = {};
    deals.forEach(d => {
      pipelineBySector[d.sector] = (pipelineBySector[d.sector] || 0) + d.deal_value;
    });

    const totalWorkOrders = workOrders.length;
    const completedWorkOrders = workOrders.filter(w => ["done", "completed", "finished"].includes(w.status.toLowerCase())).length;

    // Delayed Logic
    const now = new Date();
    const delayedWorkOrders = workOrders.filter(w => {
      const s = w.status.toLowerCase();
      if (s.includes("delayed") || s.includes("stuck") || s.includes("issue")) return true;
      if (w.end_date && !["done", "completed"].includes(s)) {
        return new Date(w.end_date) < now;
      }
      return false;
    }).length;

    const executionStatusBreakdown: Record<string, number> = {};
    workOrders.forEach(w => {
      executionStatusBreakdown[w.status] = (executionStatusBreakdown[w.status] || 0) + 1;
    });

    return {
      deals,
      workOrders,
      kpis: {
        totalPipelineValue,
        expectedRevenueWeighted,
        dealsCount: deals.length,
        openDealsCount,
        pipelineBySector,
        totalWorkOrders,
        completedWorkOrders,
        delayedWorkOrders,
        executionStatusBreakdown
      },
      dataQuality: quality
    };

  } catch (err) {
    console.error("Error fetching Monday data:", err);
    throw err;
  }
}
