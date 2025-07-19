export interface PersonajeLocalizado {
    id: string;
    recordType: string;
    fechaCreacion: string;
    swapiId: number;
    CordenadasId: string;
    personaje: {
        nombre: string;
        altura: string;
        peso: string;
        color_cabello: string;
        color_piel: string;
        color_ojos: string;
        nacimiento: string;
        genero: string;
    };
    CordenadasMundo: {
        ip: string;
        pais: string;
        region: string;
        ciudad: string;
        latitud: string;
        longitud: string;
    }
}

export interface DatoPersonalizado {
    id: string;
    [key: string]: any;
}
