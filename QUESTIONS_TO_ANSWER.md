# Questions to Answer Before Implementation

Please answer these questions so I can start implementing. For each question, either:
- ✅ = Yes/Agree with recommendation
- ❌ = No/Disagree  
- 📝 = Provide specific answer

---

## 🔐 Authentication & Authorization

### Q1: Super Admin Creation Method
**Options:**
- A) Seed script (recommended) - `prisma/seed.ts` with env check
- B) Manual DB insert
- C) Environment variable + migration

**Your Answer:** [A/B/C]

---

### Q2: Super Admin Access
**Question:** Should super admin:
- ✅ Access `/admin/*` routes (admin dashboard)
- ✅ Access `/dashboard/*` routes (can view any business as admin)
- ❓ Create/edit/delete businesses via API?

**Your Answer:** [Yes/No/Explain]

---

## 📊 Admin Dashboard Features

### Q3: Admin Dashboard Stats
**Question:** What stats should admin dashboard home show?
- Total businesses
- Total active businesses
- Total messages (all businesses)
- Total users
- Recent signups
- Other: ______________

**Your Answer:** [List what you want]

---

### Q4: Business Editable Fields (by Super Admin)
**Question:** What fields should super admin be able to edit?
- All fields
- Only specific fields: ______________

**Your Answer:** [All/Specific fields]

---

### Q5: Business Deletion
**Question:** Should super admin be able to delete businesses?
- ✅ Yes (with cascade delete)
- ❌ No (only deactivate)
- ❓ Other: ______________

**Your Answer:** [Yes/No/Other]

---

## 🔗 Meta Integration

### Q6: Meta Developer Account
**Question:** 
- ✅ Do you have a Meta Developer account?
- ❌ Need to create one?
- 📝 If yes, do you have an app already?

**Your Answer:** [Yes/No, App status]

---

### Q7: Production Domain
**Question:** What's your production domain? (for OAuth redirect URI)

**Example:** `https://yourdomain.com`

**Your Answer:** [Domain or "Not set yet"]

---

### Q8: Multiple WhatsApp Numbers
**Question:** Can a business connect multiple WhatsApp numbers?
- ✅ Yes (more flexible, but complex)
- ❌ No, one per business (simpler, recommended for MVP)

**Your Answer:** [Yes/No]

---

### Q9: Disconnect Behavior
**Question:** When business disconnects integration:
- ✅ Mark inactive (preserves history, can reconnect)
- ❌ Delete Integration record (cleaner, loses history)
- ❓ Other: ______________

**Your Answer:** [Inactive/Delete/Other]

---

## 💾 Database & Migration

### Q10: Migration Strategy
**Question:** When to run schema migrations?
- ✅ Run now (before any new features)
- ❌ Wait until after development
- 📝 Other approach: ______________

**Your Answer:** [Now/Later/Other]

---

### Q11: Existing User Role Migration
**Question:** How to handle existing users with `role="owner"`?
- ✅ Convert to `BUSINESS_OWNER` enum value (automatic in migration)
- 📝 Manual review needed? (if yes, explain)

**Your Answer:** [Auto convert/Manual]

---

## 🎨 UI/UX Decisions

### Q12: Admin Dashboard Design
**Question:** Should admin dashboard:
- ✅ Match business dashboard design (consistent)
- ❌ Different design (more admin-focused)
- 📝 Other: ______________

**Your Answer:** [Match/Different/Other]

---

## 🚀 Priority & Scope

### Q13: MVP Scope
**Question:** For MVP, should we:
- ✅ Start with WhatsApp only (simpler)
- ❌ Include Instagram + Facebook from start (more complex)

**Your Answer:** [WhatsApp only/All platforms]

---

### Q14: Implementation Order
**Question:** Preferred order:
- ✅ Schema → Super Admin → Meta (recommended)
- ❌ Schema → Meta → Super Admin
- 📝 Other: ______________

**Your Answer:** [Recommended/Other]

---

## 🔧 Technical Decisions

### Q15: Business.aiSettings Format
**Current:** Separate fields (`aiPersonality`, `aiGreeting`, `aiInstructions`)  
**Architecture:** Single JSON field

**Question:** Keep separate fields or migrate to JSON?
- ✅ Keep separate (type-safe, easier queries)
- ❌ Migrate to JSON (more flexible)

**Your Answer:** [Keep/Migrate]

---

### Q16: Old Channel Fields Cleanup
**Question:** Business model has:
- `whatsappPhoneId` (old)
- `vapiAssistantId`, `vapiPhoneNumber` (old)

Should we:
- ✅ Keep them (backward compatibility, friend might use)
- ❌ Remove (cleaner schema)
- 📝 Mark as deprecated

**Your Answer:** [Keep/Remove/Deprecate]

---

## ✅ Quick Approval Checklist

If you agree with all recommendations, just check these:

- [ ] Use Supabase Auth (keep current, don't switch to NextAuth)
- [ ] Super admin: businessId nullable, seed script for first admin
- [ ] Skip Message.channel field for MVP (infer from Conversation)
- [ ] Keep Business.aiSettings as separate fields (don't migrate to JSON)
- [ ] Keep old channel fields (whatsappPhoneId, etc.) for now
- [ ] One WhatsApp number per business (simpler MVP)
- [ ] Mark integrations inactive on disconnect (don't delete)
- [ ] Schema updates first (before other features)
- [ ] WhatsApp only for MVP (add Instagram/Facebook later)

**If all checked, I can proceed with recommended defaults!**

---

## 📝 Additional Notes

Add any other considerations, preferences, or requirements here:

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Once answered, I'll start implementing Phase 1 (Schema Updates) immediately!** 🚀


