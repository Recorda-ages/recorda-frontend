import { Artist } from "@/types/artist";

const MOCK_ARTISTS: Artist[] = [
  {
    id: "1",
    name: "The Beatles",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/beatles/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5ebe9348cc01ff5d55971b22433"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "2",
    name: "Queen",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/queen/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb2ddb3d7a8d11634625b6a378"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "3",
    name: "David Bowie",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/bowie/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb0092c4d9bc2133a8a30ef1d4"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "4",
    name: "Pink Floyd",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/floyd/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb8ac052ed34e2b02ea4280cf1"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "5",
    name: "Radiohead",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/radiohead/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb38cc84a44b150965bc93b169"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "6",
    name: "Nirvana",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/nirvana/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb1d6ebfa773199d98cb2ecf57"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "7",
    name: "Metallica",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/metallica/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5ebc14c330f6580e03be81f9cf1"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "8",
    name: "Led Zeppelin",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/zeppelin/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd7a4f9f7c0064eb6f3933c06"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "9",
    name: "Arctic Monkeys",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/arctic/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f"
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  {
    id: "10",
    name: "Foo Fighters",
<<<<<<< HEAD
    imageUrl: "https://picsum.photos/seed/foo/200/200"
=======
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb38d2f1f50a80dc24637e19b3"
>>>>>>> 48c7b64 (ajuste design parte 1)
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
