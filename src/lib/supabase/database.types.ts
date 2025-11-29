export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    phone: string | null
                    full_name: string | null
                    avatar_url: string | null
                    is_super_admin: boolean | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    phone?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    is_super_admin?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    phone?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    is_super_admin?: boolean | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
                    plan_id: string | null
                    current_period_end: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
                    plan_id?: string | null
                    current_period_end?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    status?: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
                    plan_id?: string | null
                    current_period_end?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            visitor_codes: {
                Row: {
                    id: string
                    community_id: string
                    host_id: string
                    visitor_name: string
                    access_code: string
                    valid_from: string
                    valid_until: string
                    is_one_time: boolean
                    used_at: string | null
                    created_at: string
                    vehicle_plate: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    community_id: string
                    host_id: string
                    visitor_name: string
                    access_code: string
                    valid_from: string
                    valid_until: string
                    is_one_time?: boolean
                    used_at?: string | null
                    created_at?: string
                    vehicle_plate?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    community_id?: string
                    host_id?: string
                    visitor_name?: string
                    access_code?: string
                    valid_from?: string
                    valid_until?: string
                    is_one_time?: boolean
                    used_at?: string | null
                    created_at?: string
                    vehicle_plate?: string | null
                    is_active?: boolean
                }
                Relationships: [
                    {
                        foreignKeyName: "visitor_codes_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "visitor_codes_host_id_fkey"
                        columns: ["host_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            communities: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    address: string | null
                    owner_id: string
                    created_at: string
                    max_residents_per_household: number
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    address?: string | null
                    owner_id: string
                    created_at?: string
                    max_residents_per_household?: number
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    address?: string | null
                    owner_id?: string
                    created_at?: string
                    max_residents_per_household?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "communities_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            households: {
                Row: {
                    id: string
                    community_id: string
                    name: string
                    contact_email: string | null
                    created_at: string
                    status: 'active' | 'suspended'
                }
                Insert: {
                    id?: string
                    community_id: string
                    name: string
                    contact_email?: string | null
                    created_at?: string
                    status?: 'active' | 'suspended'
                }
                Update: {
                    id?: string
                    community_id?: string
                    name?: string
                    contact_email?: string | null
                    created_at?: string
                    status?: 'active' | 'suspended'
                }
                Relationships: [
                    {
                        foreignKeyName: "households_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    }
                ]
            }
            members: {
                Row: {
                    id: string
                    community_id: string
                    user_id: string
                    role: 'community_manager' | 'guard' | 'resident' | 'head_of_security'
                    unit_number: string | null
                    status: 'pending' | 'approved' | 'rejected' | 'suspended'
                    created_at: string
                    household_id: string | null
                    is_household_head: boolean
                }
                Insert: {
                    id?: string
                    community_id: string
                    user_id: string
                    role: 'community_manager' | 'guard' | 'resident' | 'head_of_security'
                    unit_number?: string | null
                    status?: 'pending' | 'approved' | 'rejected' | 'suspended'
                    created_at?: string
                    household_id?: string | null
                    is_household_head?: boolean
                }
                Update: {
                    id?: string
                    community_id?: string
                    user_id?: string
                    role?: 'community_manager' | 'guard' | 'resident' | 'head_of_security'
                    unit_number?: string | null
                    status?: 'pending' | 'approved' | 'rejected' | 'suspended'
                    created_at?: string
                    household_id?: string | null
                    is_household_head?: boolean
                }
                Relationships: [
                    {
                        foreignKeyName: "members_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "members_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "members_household_id_fkey"
                        columns: ["household_id"]
                        referencedRelation: "households"
                        referencedColumns: ["id"]
                    }
                ]
            }
            channels: {
                Row: {
                    id: string
                    community_id: string
                    name: string
                    slug: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    community_id: string
                    name: string
                    slug: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    community_id?: string
                    name?: string
                    slug?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "channels_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    }
                ]
            }
            posts: {
                Row: {
                    id: string
                    channel_id: string
                    user_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    channel_id: string
                    user_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    channel_id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "posts_channel_id_fkey"
                        columns: ["channel_id"]
                        referencedRelation: "channels"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "posts_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            events: {
                Row: {
                    id: string
                    community_id: string
                    title: string
                    description: string | null
                    start_time: string
                    end_time: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    community_id: string
                    title: string
                    description?: string | null
                    start_time: string
                    end_time: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    community_id?: string
                    title?: string
                    description?: string | null
                    start_time?: string
                    end_time?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "events_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: 'info' | 'warning' | 'invite' | 'alert'
                    message: string
                    read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'info' | 'warning' | 'invite' | 'alert'
                    message: string
                    read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'info' | 'warning' | 'invite' | 'alert'
                    message?: string
                    read?: boolean
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            },
            shifts: {
                Row: {
                    id: string
                    community_id: string
                    guard_id: string
                    start_time: string
                    end_time: string
                    status: 'scheduled' | 'active' | 'completed' | 'cancelled'
                    clock_in_time: string | null
                    clock_out_time: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    community_id: string
                    guard_id: string
                    start_time: string
                    end_time: string
                    status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
                    clock_in_time?: string | null
                    clock_out_time?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    community_id?: string
                    guard_id?: string
                    start_time?: string
                    end_time?: string
                    status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
                    clock_in_time?: string | null
                    clock_out_time?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "shifts_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "shifts_guard_id_fkey"
                        columns: ["guard_id"]
                        referencedRelation: "members"
                        referencedColumns: ["id"]
                    }
                ]
            },
            visitor_logs: {
                Row: {
                    id: string
                    community_id: string
                    visitor_code_id: string
                    entered_at: string
                    exited_at: string | null
                    entry_point: string | null
                    exit_point: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    community_id: string
                    visitor_code_id: string
                    entered_at?: string
                    exited_at?: string | null
                    entry_point?: string | null
                    exit_point?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    community_id?: string
                    visitor_code_id?: string
                    entered_at?: string
                    exited_at?: string | null
                    entry_point?: string | null
                    exit_point?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "visitor_logs_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "visitor_logs_visitor_code_id_fkey"
                        columns: ["visitor_code_id"]
                        referencedRelation: "visitor_codes"
                        referencedColumns: ["id"]
                    }
                ]
            },
            bills: {
                Row: {
                    id: string
                    community_id: string
                    household_id: string
                    title: string
                    description: string | null
                    amount: number
                    due_date: string
                    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    community_id: string
                    household_id: string
                    title: string
                    description?: string | null
                    amount: number
                    due_date: string
                    status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    community_id?: string
                    household_id?: string
                    title?: string
                    description?: string | null
                    amount?: number
                    due_date?: string
                    status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bills_community_id_fkey"
                        columns: ["community_id"]
                        referencedRelation: "communities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bills_household_id_fkey"
                        columns: ["household_id"]
                        referencedRelation: "households"
                        referencedColumns: ["id"]
                    }
                ]
            },
            payments: {
                Row: {
                    id: string
                    bill_id: string
                    amount: number
                    payment_date: string
                    method: 'card' | 'bank_transfer' | 'cash' | 'other'
                    reference: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    bill_id: string
                    amount: number
                    payment_date?: string
                    method: 'card' | 'bank_transfer' | 'cash' | 'other'
                    reference?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    bill_id?: string
                    amount?: number
                    payment_date?: string
                    method?: 'card' | 'bank_transfer' | 'cash' | 'other'
                    reference?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payments_bill_id_fkey"
                        columns: ["bill_id"]
                        referencedRelation: "bills"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
