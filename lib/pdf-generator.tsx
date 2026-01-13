import React from "react"
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"

// Professional CV color scheme - Schwarz/Grau Abstufungen
const colors = {
  black: "#000000", // 100% Schwarz - Haupt-Titel (Name)
  darkGray: "#333333", // ~80% Schwarz - Tagline, Education Details
  mediumGray: "#4d4d4d", // ~70% Schwarz - Bullet-Texte, Skill Items
  lightGray: "#666666", // ~60% Schwarz - Kontakt-Info
  divider: "#000000", // 100% Schwarz - Section Dividers
}

const styles = StyleSheet.create({
  page: {
    padding: "10mm",
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.black,
  },
  // Header styles
  header: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "flex-start",
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 3,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: colors.black, // 100% Schwarz - Haupt-Titel
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: colors.darkGray, // ~80% Schwarz
    marginBottom: 8,
    fontFamily: "Helvetica",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  contactText: {
    fontSize: 10,
    color: colors.lightGray, // ~60% Schwarz
  },
  contactSeparator: {
    fontSize: 10,
    color: colors.lightGray, // ~60% Schwarz
    marginHorizontal: 6,
  },
  // Section styles
  section: {
    marginBottom: 14,
  },
  sectionTitleContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.black, // 100% Schwarz
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.25, // Zeilenabstand wie in Screenshot 1 (1.2-1.3)
    color: colors.mediumGray, // ~70% Schwarz - wie Bullet-Texte
  },
  // Experience styles
  experienceItem: {
    marginBottom: 14,
  },
  experienceHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
    alignItems: "baseline",
  },
  jobTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.black, // 100% Schwarz
  },
  companyInfo: {
    fontSize: 10,
    color: colors.black, // 100% Schwarz
  },
  bulletContainer: {
    paddingLeft: 12,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingRight: 10,
  },
  bulletPoint: {
    width: 12,
    fontSize: 10,
    color: colors.mediumGray, // ~70% Schwarz
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.25, // Zeilenabstand wie in Screenshot 1 (1.2-1.3)
    color: colors.mediumGray, // ~70% Schwarz - Bullet-Texte
  },
  // Skills styles
  skillRow: {
    marginBottom: 6,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.black, // 100% Schwarz
  },
  skillItems: {
    fontSize: 10,
    color: colors.mediumGray, // ~70% Schwarz - Skill Items
    lineHeight: 1.25, // Zeilenabstand wie in Screenshot 1 (1.2-1.3)
  },
  // Education/Certification row style
  educationRow: {
    marginBottom: 3,
  },
  educationDegree: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.black, // 100% Schwarz
  },
  educationDetails: {
    fontSize: 10,
    color: colors.darkGray, // ~80% Schwarz - Education Details
  },
})

// Helper component for section with title and divider
const SectionTitle = ({ title }: { title: string }) => (
  <View style={styles.sectionTitleContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
)

// Helper to build contact info with separators
const ContactInfo = ({ items }: { items: (string | undefined)[] }) => {
  const validItems = items.filter(Boolean) as string[]
  return (
    <View style={styles.contactRow}>
      {validItems.map((item, idx) => (
        <View key={idx} style={{ flexDirection: "row" }}>
          <Text style={styles.contactText}>{item}</Text>
          {idx < validItems.length - 1 && (
            <Text style={styles.contactSeparator}>|</Text>
          )}
        </View>
      ))}
    </View>
  )
}

// Helper function to normalize date format (replace . with /)
const normalizeDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ""
  // Replace dots with slashes if present
  return dateStr.replace(/\./g, "/")
}

// Helper function to detect if CV is in German
const isGermanCV = (cv: any): boolean => {
  const cvText = `${cv.summary || ""} ${cv.header?.tagline || ""}`.toLowerCase()
  const germanKeywords = ["profil", "erfahrung", "ausbildung", "zertifizierungen", "sprachen", "kompetenzen", "heute"]
  const englishKeywords = ["profile", "experience", "education", "certifications", "languages", "skills", "present"]
  // Check if German keywords are present and no English keywords
  const hasGerman = germanKeywords.some(keyword => cvText.includes(keyword))
  const hasEnglish = englishKeywords.some(keyword => cvText.includes(keyword))
  // Default to German if ambiguous
  return hasGerman || (!hasEnglish && !hasGerman)
}

export function generateCVPdf(cv: any, user: any, profileImageUrl?: string) {
  const isGerman = isGermanCV(cv)
  const currentText = isGerman ? "Heute" : "Present"
  
  // Section titles based on language
  const sectionTitles = {
    profile: isGerman ? "PROFIL" : "PROFILE",
    experience: isGerman ? "ERFAHRUNG" : "EXPERIENCE",
    education: isGerman ? "AUSBILDUNG" : "EDUCATION",
    certifications: isGerman ? "ZERTIFIZIERUNGEN" : "CERTIFICATIONS",
    languages: isGerman ? "SPRACHEN" : "LANGUAGES",
    skills: isGerman ? "KOMPETENZEN" : "SKILLS",
  }
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with profile image and text aligned */}
        <View style={styles.header}>
          {profileImageUrl && (
            <Image src={profileImageUrl} style={styles.profileImage} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.name}>
              {cv.header?.firstName || ""} {cv.header?.lastName || ""}
            </Text>
            {cv.header?.tagline && (
              <Text style={styles.tagline}>{cv.header.tagline}</Text>
            )}
            <ContactInfo
              items={[
                cv.header?.location,
                cv.header?.email,
                cv.header?.phone,
                cv.header?.linkedIn,
              ]}
            />
          </View>
        </View>

        {/* Summary/Profile Section */}
        {cv.summary && (
          <View style={styles.section}>
            <SectionTitle title={sectionTitles.profile} />
            <Text style={styles.sectionContent}>{cv.summary}</Text>
          </View>
        )}

        {/* Experience Section */}
        {cv.experiences && cv.experiences.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title={sectionTitles.experience} />
            {cv.experiences.map((exp: any, idx: number) => (
              <View key={idx} style={styles.experienceItem}>
                {/* Experience header: Job Title | Company | Location | Dates */}
                <View style={styles.experienceHeader}>
                  <Text style={styles.jobTitle}>{exp.jobTitle}</Text>
                  <Text style={styles.companyInfo}>
                    {" "}
                    {exp.company && `| ${exp.company}`}
                    {exp.location && ` | ${exp.location}`}
                    {" | "}
                    {normalizeDate(exp.startDate)}
                    {exp.isCurrent ? ` - ${currentText}` : exp.endDate ? ` - ${normalizeDate(exp.endDate)}` : ""}
                  </Text>
                </View>
                {/* Bullet points with proper indentation */}
                {exp.bullets && exp.bullets.length > 0 && (
                  <View style={styles.bulletContainer}>
                    {exp.bullets.map((bullet: string, bulletIdx: number) => (
                      <View key={bulletIdx} style={styles.bulletRow}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education Section */}
        {cv.education && cv.education.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title={sectionTitles.education} />
            {cv.education.map((edu: any, idx: number) => (
              <View key={idx} style={styles.educationRow}>
                <Text>
                  <Text style={styles.educationDegree}>
                    {edu.degree}
                    {edu.grade && ` (${edu.grade})`}
                  </Text>
                  <Text style={styles.educationDetails}>
                    {edu.institution && ` | ${edu.institution}`}
                    {(edu.startDate || edu.endDate) && (
                      ` | ${edu.startDate || ""}${edu.endDate ? ` - ${edu.endDate}` : ""}`
                    )}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications Section */}
        {cv.certifications && cv.certifications.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title={sectionTitles.certifications} />
            {cv.certifications.map((cert: any, idx: number) => (
              <View key={idx} style={styles.educationRow}>
                <Text>
                  <Text style={styles.educationDegree}>{cert.name}</Text>
                  <Text style={styles.educationDetails}>
                    {cert.issuer && ` | ${cert.issuer}`}
                    {cert.year && ` | ${cert.year}`}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages Section */}
        {cv.languages && cv.languages.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title={sectionTitles.languages} />
            <Text style={styles.sectionContent}>
              {cv.languages.map((lang: any, idx: number) => (
                `${lang.name} (${lang.level})${idx < cv.languages.length - 1 ? " | " : ""}`
              )).join("")}
            </Text>
          </View>
        )}

        {/* Skills/Competencies Section */}
        {cv.skills && cv.skills.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title={sectionTitles.skills} />
            {cv.skills.map((skill: any, idx: number) => (
              <View key={idx} style={styles.skillRow}>
                <Text>
                  <Text style={styles.skillCategory}>{skill.category}: </Text>
                  <Text style={styles.skillItems}>
                    {skill.items?.join(" | ") || ""}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}

export function generateCoverLetterPdf(
  coverLetter: string,
  user: any,
  profile: any,
  jobTitle: string,
  company: string,
  profileImageUrl?: string,
  cvData?: any
) {
  // Use CV header data if available, otherwise fall back to profile/user data
  const firstName = cvData?.header?.firstName || user?.firstName || ""
  const lastName = cvData?.header?.lastName || user?.lastName || ""
  const tagline = cvData?.header?.tagline || profile?.tagline || ""
  const email = cvData?.header?.email || profile?.email || user?.email || ""
  const phone = cvData?.header?.phone || profile?.phone || ""
  const location = cvData?.header?.location || (profile?.city && profile?.country ? `${profile.city}, ${profile.country}` : profile?.city || "")
  const linkedInUrl = cvData?.header?.linkedIn || profile?.linkedInUrl || ""
  
  // Extract city for date location
  const city = profile?.city || ""

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - same style as CV */}
        <View style={styles.header}>
          {profileImageUrl && (
            <Image src={profileImageUrl} style={styles.profileImage} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.name}>
              {firstName} {lastName}
            </Text>
            {tagline && <Text style={styles.tagline}>{tagline}</Text>}
            <ContactInfo
              items={[
                location || undefined,
                email,
                phone,
                linkedInUrl,
              ]}
            />
          </View>
        </View>

        {/* Date - right aligned */}
        <View style={{ alignItems: "flex-end", marginBottom: 24 }}>
          <Text style={styles.sectionContent}>
            {city ? `${city}, ` : ""}
            {new Date().toLocaleDateString("de-CH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Subject line */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: colors.black }}>
            Bewerbung als {jobTitle}
          </Text>
        </View>

        {/* Letter content */}
        <View style={styles.section}>
          <Text style={styles.sectionContent}>{coverLetter}</Text>
        </View>

        {/* Signature */}
        <View style={{ marginTop: 36 }}>
          <Text style={styles.sectionContent}>Freundliche Grüsse</Text>
          <Text style={{ marginTop: 24, fontFamily: "Helvetica-Bold", color: colors.black }}>
            {firstName} {lastName}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

