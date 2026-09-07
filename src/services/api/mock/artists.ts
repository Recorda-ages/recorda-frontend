import { Artist } from "@/types/artist";

const MOCK_ARTISTS: Artist[] = [
  {
    id: "1",
    name: "The Beatles",
    imageUrl: "https://picsum.photos/seed/beatles/200/200"
  },
  {
    id: "2",
    name: "Queen",
    imageUrl: "https://picsum.photos/seed/queen/200/200"
  },
  {
    id: "3",
    name: "David Bowie",
    imageUrl: "https://picsum.photos/seed/bowie/200/200"
  },
  {
    id: "4",
    name: "Pink Floyd",
    imageUrl: "https://picsum.photos/seed/floyd/200/200"
  },
  {
    id: "5",
    name: "Radiohead",
    imageUrl: "https://picsum.photos/seed/radiohead/200/200"
  },
  {
    id: "6",
    name: "Nirvana",
    imageUrl: "https://picsum.photos/seed/nirvana/200/200"
  },
  {
    id: "7",
    name: "Metallica",
    imageUrl: "https://picsum.photos/seed/metallica/200/200"
  },
  {
    id: "8",
    name: "Led Zeppelin",
    imageUrl: "https://picsum.photos/seed/zeppelin/200/200"
  },
  {
    id: "9",
    name: "Arctic Monkeys",
    imageUrl: "https://picsum.photos/seed/arctic/200/200"
  },
  {
    id: "10",
    name: "Foo Fighters",
    imageUrl: "https://picsum.photos/seed/foo/200/200"
  }
];

export async function searchArtistsMock(query: string): Promise<Artist[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        resolve([]);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const results = MOCK_ARTISTS.filter((artist) =>
        artist.name.toLowerCase().includes(lowerQuery)
      );

      resolve(results);
    }, 500); // 500ms delay to simulate network latency
  });
}
