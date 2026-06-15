export const siteContentOverrides = {
  coupleName: "Sara & Fran",
  weddingDate: {
    display: "22 de agosto de 2026 · 19:00",
    hero: "22 de agosto de 2026",
    iso: "2026-08-22T19:00:00",
  },
  home: {
    hero: {
      text: "Después de muchos viajes, cafés improvisados y momentos compartidos, queremos celebrar el día más importante de nuestra historia con las personas que más queremos.",
      primaryAction: "Confirmar asistencia",
      secondaryAction: "Ver detalles",
      scrollHint: "Desliza",
    },
    cards: [
      {
        title: "Ceremonia",
        subtitle: "19:00 · Aguas del Pino",
        description:
          "Una ceremonia al aire libre rodeados de naturaleza, música y una puesta de sol inolvidable.",
        to: "/details#ceremony",
        icon: "heart-handshake",
      },
      {
        title: "Transporte",
        subtitle: "Huelva y Corrales",
        description:
          "Consulta los horarios de ida y vuelta para disfrutar sin preocuparte por el desplazamiento.",
        to: "/details#transport",
        icon: "bus-front",
      },
      {
        title: "Celebración",
        subtitle: "Cena y fiesta",
        description:
          "Después de la ceremonia nos espera una noche especial para brindar, cenar y bailar juntos.",
        to: "/details#timeline",
        icon: "sparkles",
      },
    ],
    cta: {
      eyebrow: "Te esperamos",
      title: "Queremos celebrarlo contigo",
      text: "Nos ayudará mucho saber si podrás acompañarnos en este día tan especial.",
      primaryAction: "Confirmar asistencia",
      secondaryAction: "Volver al inicio",
    },
  },
  rsvp: {
    eyebrow: "Sara & Fran",
    title: "Confirmación de asistencia",
    text: "Estamos deseando celebrar este día con vosotros. Podéis confirmar vuestra asistencia y gestionar todos los invitados desde este formulario.",
  },
  help: {
    eyebrow: "Ayuda",
    title: "Contacto",
    text: "Si tienes cualquier duda o problema con la confirmacion, puedes escribirnos directamente.",
    buttonText: "Ayuda",
    openLabel: "Abrir ayuda",
    phonePending: "Telefono pendiente",
    emailPending: "Email pendiente",
    contacts: [
      {
        name: "Sara",
        phone: "616642844",
        email: "sarusalonso@gmail.com",
      },
      {
        name: "Fran",
        phone: "695537560",
        email: "fcojaviertoscano@outlook.es",
      },
    ],
  },
  details: {
    history: {
      eyebrow: "Construida poco a poco",
      title: "Nuestra historia",
      text: "Entre viajes, momentos sencillos y recuerdos compartidos, llegamos hasta este día con muchísima ilusión.",
      images: [
        {
          src: "/carousel/image0.jpeg",
          alt: "Sara y Fran celebrando su historia",
          caption: "El inicio de una historia que fue creciendo poco a poco.",
        },
        {
          src: "/carousel/image1.jpeg",
          alt: "Sara y Fran celebrando su historia",
          caption: "Pequeños momentos que se fueron convirtiendo en hogar.",
        },
        {
          src: "/carousel/image2.jpeg",
          alt: "Sara y Fran celebrando su historia",
          caption: "Y ahora, un nuevo capítulo que queremos vivir contigo.",
        },
        {
          src: "/carousel/image3.jpeg",
          alt: "Sara y Fran celebrando su historia",
          caption:
            "Un sí que hizo todavía más grande todo lo que estaba por venir.",
        },
        {
          src: "/carousel/image4.jpeg",
          alt: "Sara y Fran celebrando su historia",
          caption:
            "Viajes, risas y ciudades que ya forman parte de nuestra historia.",
        },
        {
          src: "/carousel/image5.jpeg",
          alt: "Sara y Fran celebrando su historia",
          caption:
            "Celebrar la vida juntos siempre ha sido nuestro mejor plan.",
        },
      ],
    },
    countdown: {
      eyebrow: "Cada vez queda menos",
      title: "Cuenta atrás",
      text: "El tiempo avanza hacia un día que queremos vivir rodeados de las personas que más queremos.",
      labels: {
        days: "Días",
        hours: "Horas",
        minutes: "Minutos",
        seconds: "Segundos",
      },
    },
    ceremony: {
      eyebrow: "Un lugar para recordar",
      title: "Ceremonia",
      text: "Un espacio rodeado de naturaleza y con vistas al entorno del Río Piedras.",
      address: "Aguas del Pino, Ctra. A-5052, km 4 · Punta Umbría, Huelva.",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Aguas%20del%20Pino%2C%20Ctra%20A-5052%2C%20km%204%2C%20Punta%20Umbr%C3%ADa%2C%20Huelva",
      mapLabel: "Como llegar",
      images: [
        {
          src: "/carousel/aguas-del-pino-1.jpg",
          alt: "Exterior de Aguas del Pino",
          caption: "Un entorno natural con vistas al Río Piedras.",
        },
        {
          src: "/carousel/aguas-del-pino-2.jpg",
          alt: "Ceremonia exterior en Aguas del Pino",
          caption: "Una ceremonia al aire libre, rodeada de luz y naturaleza.",
        },
      ],
    },
    transport: {
      eyebrow: "Llegar y volver con tranquilidad",
      title: "Transporte",
      text: "Los puntos de salida y regreso serán los mismos para ambos trayectos.",
      routes: [
        {
          title: "Ida",
          subtitle: "Salida hacia Aguas del Pino",
          times: [
            {
              time: "18:00",
              label: "Huelva",
              description: "Hotel NH Luz",
              mapUrl: "https://maps.app.goo.gl/fRcvoUKdD2bMizG6A",
            },
            {
              time: "18:20",
              label: "Corrales",
              description: "Comercial Colón",
              mapUrl: "https://maps.app.goo.gl/Mz4nGyrVyjGyE5N49",
            },
          ],
        },
        {
          title: "Vuelta",
          subtitle: "Regreso tras la celebración",
          times: [
            {
              time: "03:00",
              label: "Primera",
              description: "Corrales - Huelva",
            },
            {
              time: "06:00",
              label: "Última",
              description: "Corrales - Huelva",
            },
          ],
        },
      ],
    },
    timeline: {
      eyebrow: "El ritmo del día",
      title: "Timeline",
      text: "Una guía sencilla para que puedas disfrutar cada momento.",
      events: [
        {
          time: "19:00",
          title: "Ceremonia",
          description:
            "Celebraremos el momento más especial del día en un entorno natural y cuidado.",
          icon: "heart-handshake",
        },
        {
          time: "20:00",
          title: "Cóctel",
          description:
            "Primer brindis para encontrarnos y empezar a disfrutar de la celebración.",
          icon: "glass-water",
        },
        {
          time: "22:00",
          title: "Cena",
          description:
            "Pensada para compartir, disfrutar y celebrar con las personas que queremos.",
          icon: "utensils",
        },
        {
          time: "00:00",
          title: "Fiesta",
          description:
            "La noche continuará con música, baile y muchas sorpresas.",
          icon: "party-popper",
        },
      ],
    },
  },
  admin: {
    cards: [
      {
        title: "Tareas",
        subtitle: "Checklist de boda",
        description:
          "Organizar preparativos por categoria, prioridad, responsable y fecha.",
        to: "/admin/tasks",
        icon: "list-todo",
      },
      {
        title: "Resumen",
        subtitle: "Todo en un vistazo",
        description:
          "Consultar totales, asistencia, alergias y horarios de autobús.",
        to: "/admin/stats",
        icon: "chart-column",
      },
      {
        title: "Notificaciones",
        subtitle: "Avisos internos",
        description:
          "Crear avisos, pagos y confirmaciones pendientes de revisar.",
        to: "/admin/notifications",
        icon: "bell",
      },
      {
        title: "Invitados",
        subtitle: "Gestiona la lista",
        description:
          "Gestionar confirmaciones, datos de contacto, alergias y transporte.",
        to: "/admin/guests",
        icon: "clipboard-check",
      },
      {
        title: "Mesas",
        subtitle: "Organiza asientos",
        description:
          "Consultar la distribución de mesas, asientos e invitados asignados.",
        to: "/admin/tables",
        icon: "armchair",
      },
      {
        title: "Proveedores",
        subtitle: "Gestiona servicios",
        description:
          "Organizar proveedores, servicios contratados y plazos de pago.",
        to: "/admin/providers",
        icon: "receipt-text",
      },
    ],
  },
};
