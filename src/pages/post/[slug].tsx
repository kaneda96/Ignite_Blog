/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';

import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { UtterancesComments } from '../../components/Comments';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Header from '../../components/Header';

interface PostsReferences {
  uid: string;
  title: string;
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost?: Post;
  lastPost?: Post;
}

export default function Post({ post, nextPost, lastPost }: PostProps) {
  const router = useRouter();
  let counts = 0;

  post.data.content.forEach(content => {
    content.body.forEach(body => {
      counts += body.text.split(' ').length;
    });
  });

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />
        <section className={styles.postContainer}>
          <h1 className={styles.title}>{post.data.title}</h1>
          <div className={styles.infos}>
            <AiOutlineCalendar size={20} />
            <strong>
              {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </strong>
            <AiOutlineUser size={20} />
            <strong>{post.data.author}</strong>
            <AiOutlineUser size={20} />
            <strong>4 min</strong>
            <aside>
              {`*editado em ${format(
                parseISO(post.last_publication_date),
                "dd MMM yyyy, 'às' k:m",
                {
                  locale: ptBR,
                }
              )} `}
            </aside>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(content => (
              <div className={styles.paragraphContainer}>
                <strong>{content.heading}</strong>
                {content.body.map(paragraph => (
                  <p>{paragraph.text}</p>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.paginationContent}>
            <div className={styles.direction}>
              {lastPost !== null ? (
                <div className={styles.paginationLeft}>
                  <strong>{lastPost.data.title}</strong>
                  <a href={`/post/${lastPost.uid}`}>Último Post</a>
                </div>
              ) : (
                <div className={styles.paginationLeft} />
              )}
              {nextPost !== null ? (
                <div className={styles.paginationRight}>
                  <strong>{nextPost.data.title}</strong>
                  <a href={`/post/${nextPost.uid}`}>Próximo Post</a>
                </div>
              ) : (
                <div className={styles.paginationRight} />
              )}
            </div>
          </div>
          <UtterancesComments />
        </section>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 3 }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths, // indicates that no page needs be created at build time
    fallback: true, // indicates the type of fallback
  };
};

export const getStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const post = await prismic.getByUID('post', params.slug, {});
  const nextPost = await prismic
    .queryFirst([
      Prismic.predicates.at('document.type', 'post'),
      Prismic.predicates.dateAfter(
        'document.first_publication_date',
        post.first_publication_date
      ),
    ])
    .then(res => {
      return res === undefined ? null : res;
    });

  const lastPost = await prismic
    .queryFirst([
      Prismic.predicates.at('document.type', 'post'),
      Prismic.predicates.dateBefore(
        'document.first_publication_date',
        post.first_publication_date
      ),
    ])
    .then(res => {
      return res === undefined ? null : res;
    });

  return {
    props: {
      post: {
        ...post,
      },
      nextPost,
      lastPost,
    },
  };
};
