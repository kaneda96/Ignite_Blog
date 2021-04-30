/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function HandleViewMore() {
    fetch(postsPagination.next_page)
      .then(response => {
        return response.json();
      })
      .then(response => {
        let newPosts: Post[] = [...posts];
        response.results.forEach(post => {
          newPosts = [
            ...newPosts,
            {
              ...post,
            },
          ];
        });
        setNextPage(response.next_page);
        setPosts(newPosts);
      });
  }

  return (
    <>
      <Head>
        <title>Ignite Blog</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.infos}>
                  <AiOutlineCalendar size={20} />
                  <strong>
                    {format(
                      parseISO(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </strong>
                  <AiOutlineUser size={20} />
                  <strong>{post.data.author}</strong>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage !== null ? (
          <button
            onClick={HandleViewMore}
            type="button"
            className={styles.viewMore}
          >
            Carregar mais posts
          </button>
        ) : (
          <></>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    ['', Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 2,
    }
  );

  const postsPaginationReturn: PostPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        ...post,
      };
    }),
  };
  return {
    props: { postsPagination: postsPaginationReturn },
  };
};
