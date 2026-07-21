export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  annual_revenue?: number;
  employees_count?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tags: Tag[];
}

export interface Contact {
  id: string;
  account_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  status: string; // active, inactive, bounce, unsubscribed
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  account_name?: string;
  tags: Tag[];
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  status: string; // new, contacted, qualified, lost, converted
  source?: string;
  score: number;
  assigned_to?: string;
  description?: string;
  converted_at?: string;
  converted_contact_id?: string;
  converted_account_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tags: Tag[];
}

// Creation and Update types
export interface AccountCreateInput {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  annual_revenue?: number;
  employees_count?: number;
  description?: string;
  tag_names?: string[];
}

export interface AccountUpdateInput extends Partial<AccountCreateInput> {}

export interface ContactCreateInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  status?: string;
  description?: string;
  account_id?: string;
  tag_names?: string[];
}

export interface ContactUpdateInput extends Partial<ContactCreateInput> {}

export interface LeadCreateInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  status?: string;
  source?: string;
  assigned_to?: string;
  description?: string;
  tag_names?: string[];
}

export interface LeadUpdateInput extends Partial<LeadCreateInput> {}

export interface LeadConvertInput {
  create_account: boolean;
  create_contact: boolean;
  existing_account_id?: string;
}

export interface DuplicateWarning {
  type: 'email' | 'phone';
  message: string;
}
