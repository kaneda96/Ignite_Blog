/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { ParsedUrlQuery } from 'node:querystring';

import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useState } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  let counts = 0;

  post.data.content.forEach(content => {
    content.body.forEach(body => {
      counts += body.text.split(' ').length;
    });
  });

  const readTime = `${Math.round(counts / 200)} min`;

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />
        <section className={styles.postContainer}>
          <h1>{post.data.title}</h1>
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
          </div>
          {post.data.content.map(content => (
            <div className={styles.postContent}>
              <strong>{content.heading}</strong>
              {content.body.map(paragraph => (
                <p>{paragraph.text}</p>
              ))}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 10 }
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

  // reduce -> primeiro par -> () => {}
  // reduce -> segundo par -> valor inicial
  // reduce -> parametros arrow function -> primeiro: acumulator , segundo: item
  // OBS: sempre retornar valor calculado. Pode ser

  return {
    props: {
      post: {
        ...post,
      },
    },
  };
};
