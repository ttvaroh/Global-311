# 🌍 Global-311

**Global-311** was envisioned as a mobile/web platform to centralize non-emergency incident reporting and awareness worldwide. Inspired by the "311" city service model in the U.S., the project aimed to give communities a way to **report issues, track updates, and access trusted resources** in real time.

⚠️ **Note:** This app was never fully completed — this repo represents an early prototype with partial code, design ideas, and a roadmap for what the system could become.

---

## ✨ Features (Planned & Partial)

- **User Reports**
  - Submit local incidents (infrastructure, safety hazards, environmental alerts, etc.)
  - Attach metadata: description, type, location, and optional media.

- **Global Feed**
  - Browse reports in a map or list format.
  - Filter by category, severity, or proximity.

- **Location Awareness**
  - Integration with device GPS.
  - Planned: geofencing and push notifications for nearby events.

- **Data Backend**
  - Early experimentation with **Supabase** (Postgres + Auth + Realtime).
  - Considered **Appwrite** as an alternative backend option.

- **Prototype UI**
  - Built in **React Native** (Expo).
  - Used `react-native-maps` for map-based display of reports.
  - Simple placeholder screens for submission and feed browsing.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo), Nativewind.
- **Backend / Database:** Appwrite.
- **ETL Scripts (Planned):** To process/report structured and unstructured data feeds.
- **Mapping:** react-native-maps.

---

## 📂 Project Status

- [x] Repo setup and base Expo app scaffolded.
- [x] Experimented with Supabase tables for incidents and users.
- [x] Early UI sketches and wireframes (map + report form).
- [ ] Full CRUD integration with backend.
- [ ] Authentication and user roles.
- [ ] Notifications, search, and filtering.
- [ ] Deployment.

---

## 🚧 Roadmap

1. **MVP (Unfinished)**
   - Basic incident submission form.
   - Display reports on a global map.
   - Supabase storage integration.

2. **Phase 2 (Planned)**
   - Authentication & user profiles.
   - Filtering & advanced search.
   - Push notifications.

3. **Full Scale Ideas**
   - Partnerships with NGOs, municipalities, and UN disaster response.
   - AI/ML for automated categorization and credibility scoring.
   - Offline mode with queued sync.

---

## 💡 Inspiration

311 systems in U.S. cities showed how centralizing non-emergency issues makes communities safer and more informed. **Global-311** extended this concept to a worldwide scale, where crises, hazards, or civic issues can be surfaced beyond local silos.

---

## 📖 Lessons Learned

- Early planning matters: wireframes and data models helped clarify scope.
- Building globally relevant apps raises questions of **scaling, moderation, and trustworthiness**.
- It’s okay if a project isn’t finished — prototypes teach a lot.

---

## 🙌 Acknowledgements

- Open-source community projects for mapping and civic tech.
- React Native & Expo contributors.
- Supabase for making full-stack prototyping approachable.
