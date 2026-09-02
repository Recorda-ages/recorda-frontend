import { Artist } from "@/types/artist";

const MOCK_ARTISTS: Artist[] = [
  { id: "1", name: "The Beatles", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebe9348cc01ff5d55971b22433" },
  { id: "2", name: "Queen", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb2ddb3d7a8d11634625b6a378" },
  { id: "3", name: "David Bowie", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb0092c4d9bc2133a8a30ef1d4" },
  { id: "4", name: "Pink Floyd", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb8ac052ed34e2b02ea4280cf1" },
  { id: "5", name: "Radiohead", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb38cc84a44b150965bc93b169" },
  { id: "6", name: "Nirvana", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb1d6ebfa773199d98cb2ecf57" },
  { id: "7", name: "Metallica", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebc14c330f6580e03be81f9cf1" },
  { id: "8", name: "Led Zeppelin", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd7a4f9f7c0064eb6f3933c06" },
  { id: "9", name: "Arctic Monkeys", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f" },
  { id: "10", name: "Foo Fighters", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb38d2f1f50a80dc24637e19b3" },
];

export async function searchArtistsMock(query: string): Promise<Artist[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        resolve([]);
        return;
      }
      
      const lowerQuery = query.toLowerCase();
      const results = MOCK_ARTISTS.filter(artist => 
        artist.name.toLowerCase().includes(lowerQuery)
      );
      
      resolve(results);
    }, 500); // 500ms delay to simulate network latency
  });
}
