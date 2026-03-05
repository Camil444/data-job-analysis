"use client";

import { useTheme } from "@/lib/theme";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div
      className="rounded-xl p-6 mb-4 transition-colors duration-200"
      style={{ backgroundColor: "var(--card-bg)", boxShadow: "var(--shadow)" }}
    >
      <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>{title}</h3>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {children}
      </div>
    </div>
  );
}

function Term({ word, children }: { word: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="font-semibold shrink-0 w-40" style={{ color: "var(--text)" }}>{word}</span>
      <span>{children}</span>
    </div>
  );
}

export default function AboutPage() {
  useTheme();

  return (
    <div className="max-w-3xl">
      <h2 className="text-4xl font-bold mb-1" style={{ color: "var(--text)" }}>A PROPOS</h2>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Comprendre les donnees, les sources et le vocabulaire du dashboard
      </p>

      {/* Objectif */}
      <Section title="Objectif du dashboard">
        <p>
          Ce dashboard analyse le <strong>marche de l&apos;emploi data en France</strong> en collectant
          et croisant des milliers d&apos;offres d&apos;emploi provenant de plusieurs plateformes.
        </p>
        <p className="mt-2">
          Il permet de repondre a des questions comme : quels sont les metiers les plus recherches ?
          Quelles competences sont les plus demandees ? Quel salaire peut-on attendre selon son profil ?
          Quelles entreprises recrutent le plus ?
        </p>
        <p className="mt-2">
          Les donnees sont collectees automatiquement, nettoyees et normalisees par un pipeline de donnees
          avant d&apos;etre affichees ici.
        </p>
      </Section>

      {/* Sources */}
      <Section title="Sources de donnees">
        <p className="mb-3">Les offres sont collectees depuis 3 plateformes :</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "LinkedIn", desc: "Reseau professionnel mondial, principale source d'offres cadres et tech" },
            { name: "Indeed", desc: "Agregateur d'offres d'emploi, large couverture du marche francais" },
            { name: "France Travail", desc: "Service public de l'emploi (ex-Pole Emploi), offres officielles" },
          ].map((src) => (
            <div key={src.name} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{src.name}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{src.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Frequence */}
      <Section title="Frequence de mise a jour">
        <p>
          Les donnees sont <strong>collectees quotidiennement</strong> via des scripts de scraping automatises.
          Apres collecte, elles passent par un pipeline de transformation (dbt) qui nettoie, normalise
          et enrichit les donnees brutes.
        </p>
        <p className="mt-2">
          La date de derniere mise a jour est affichee dans la barre laterale sous &quot;DATA JOB FRANCE&quot;.
        </p>
      </Section>

      {/* Pages */}
      <Section title="Guide des pages">
        <div className="space-y-4">
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Vue Globale</p>
            <p>
              Vue d&apos;ensemble du marche data en France. Montre la repartition des offres par metier,
              les competences les plus demandees, la localisation geographique des postes,
              les politiques de teletravail et les fourchettes salariales.
            </p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Analyst</p>
            <p>
              Focus sur les metiers d&apos;analyse : Data Analyst (analyste de donnees),
              Business Analyst (analyste metier) et BI Analyst (analyste en informatique decisionnelle).
              Ces profils transforment les donnees en insights pour aider a la prise de decision.
            </p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Engineer</p>
            <p>
              Focus sur les metiers d&apos;ingenierie des donnees : Data Engineer (ingenieur donnees),
              Analytics Engineer (ingenieur analytics) et Data Architect (architecte donnees).
              Ces profils construisent et maintiennent les infrastructures qui permettent de collecter,
              stocker et traiter les donnees.
            </p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>DS / ML / AI</p>
            <p>
              Focus sur les metiers de la science des donnees et de l&apos;intelligence artificielle :
              Data Scientist, ML Engineer (ingenieur en apprentissage automatique) et AI Engineer
              (ingenieur en intelligence artificielle). Ces profils creent des modeles predictifs
              et des systemes intelligents a partir des donnees.
            </p>
          </div>
        </div>
      </Section>

      {/* Glossaire */}
      <Section title="Glossaire">
        <div>
          <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>Indicateurs (KPIs)</p>
          <Term word="Salaire median">
            Salaire qui divise les offres en deux : la moitie gagne plus, l&apos;autre moitie gagne moins.
            Plus fiable que la moyenne car il n&apos;est pas influence par les salaires extremes.
            Exprime en annuel brut (avant impots et charges).
          </Term>
          <Term word="Combo skills #1">
            La combinaison de 3 competences techniques qui apparait le plus souvent ensemble
            dans les offres d&apos;emploi. Indique le &quot;kit de base&quot; le plus recherche.
          </Term>
          <Term word="Top metier">
            Le metier ayant le plus grand nombre d&apos;offres publiees.
          </Term>
        </div>

        <div className="mt-5">
          <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>Types de contrat</p>
          <Term word="CDI">
            Contrat a Duree Indeterminee — le contrat &quot;standard&quot;, sans date de fin prevue.
          </Term>
          <Term word="CDD">
            Contrat a Duree Determinee — contrat temporaire avec une date de fin.
          </Term>
          <Term word="Alternance">
            Formation en alternance entre ecole et entreprise (contrat d&apos;apprentissage ou de professionnalisation).
          </Term>
          <Term word="Stage">
            Convention de stage, generalement liee a un cursus scolaire.
          </Term>
        </div>

        <div className="mt-5">
          <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>Teletravail</p>
          <Term word="Full Remote">
            Travail 100% a distance, aucune presence au bureau requise.
          </Term>
          <Term word="Hybride">
            Mix entre presentiel et teletravail (generalement 2-3 jours de chaque par semaine).
          </Term>
          <Term word="Presentiel">
            Travail exclusivement sur site, au bureau.
          </Term>
        </div>

        <div className="mt-5">
          <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>Competences techniques</p>
          <Term word="SQL">
            Langage pour interroger les bases de donnees. La competence la plus demandee en data.
          </Term>
          <Term word="Python">
            Langage de programmation polyvalent, tres utilise en data science et en ingenierie des donnees.
          </Term>
          <Term word="Power BI / Tableau">
            Outils de visualisation de donnees (Business Intelligence) pour creer des tableaux de bord et rapports.
          </Term>
          <Term word="AWS / GCP / Azure">
            Les 3 principaux fournisseurs de cloud computing : Amazon Web Services, Google Cloud Platform et Microsoft Azure.
          </Term>
          <Term word="Spark">
            Framework de traitement de donnees massives (Big Data), utilise pour traiter de tres grands volumes.
          </Term>
          <Term word="Airflow / dbt">
            Outils d&apos;orchestration de pipelines de donnees. Airflow planifie les taches, dbt transforme les donnees.
          </Term>
          <Term word="PyTorch / TensorFlow">
            Frameworks de Machine Learning (apprentissage automatique) pour creer des modeles d&apos;IA.
          </Term>
          <Term word="GenAI / LLM">
            Intelligence artificielle generative / Grands modeles de langage (comme ChatGPT). Tendance recente du marche.
          </Term>
        </div>

        <div className="mt-5">
          <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>Niveaux d&apos;experience</p>
          <Term word="Junior">
            0-2 ans d&apos;experience. Profil debutant ou en sortie d&apos;etudes.
          </Term>
          <Term word="Mid">
            2-5 ans d&apos;experience. Profil confirme, autonome sur ses missions.
          </Term>
          <Term word="Senior">
            5-10 ans d&apos;experience. Profil expert, capable de mener des projets complexes.
          </Term>
          <Term word="Lead">
            10+ ans d&apos;experience. Profil de reference, souvent en charge d&apos;equipe ou de strategie.
          </Term>
        </div>

        <div className="mt-5">
          <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>Niveaux d&apos;etudes</p>
          <Term word="Bac+3">
            Licence, Bachelor, BUT — diplome universitaire de premier cycle (3 ans apres le bac).
          </Term>
          <Term word="Bac+5">
            Master, diplome d&apos;ingenieur, grande ecole — diplome de second cycle (5 ans apres le bac).
          </Term>
          <Term word="Bac+8">
            Doctorat (PhD) — diplome de recherche (8 ans apres le bac).
          </Term>
        </div>
      </Section>

      {/* Pipeline */}
      <Section title="Comment ca marche (pipeline technique)">
        <div className="flex flex-col gap-2">
          {[
            { step: "1. Collecte", desc: "Scripts de scraping Python collectent les offres sur LinkedIn, Indeed et France Travail chaque jour" },
            { step: "2. Stockage", desc: "Les donnees brutes sont stockees dans une base PostgreSQL (Neon)" },
            { step: "3. Transformation", desc: "dbt (data build tool) nettoie, deduplique et enrichit les donnees : normalisation des titres, extraction des competences, geocodage des villes" },
            { step: "4. Analyse", desc: "Les donnees transformees alimentent ce dashboard Next.js en temps reel" },
          ].map((s) => (
            <div key={s.step} className="flex gap-3 items-start rounded-lg p-3" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <span className="font-semibold text-sm shrink-0 w-28" style={{ color: "var(--accent)" }}>{s.step}</span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
